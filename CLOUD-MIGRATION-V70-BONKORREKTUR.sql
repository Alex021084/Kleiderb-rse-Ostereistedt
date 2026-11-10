-- V70: Kassenbon-Korrekturen atomar speichern.
-- Im Supabase SQL Editor vollständig ausführen und mit RUN bestätigen.
-- Artikelpositionen, Bonbetrag, Zahlungsart und Änderungshistorie werden
-- in einer einzigen Transaktion geändert. Bei einem Fehler wird alles
-- automatisch zurückgerollt.

create or replace function public.kb_edit_receipt(
  p_receipt_id bigint,
  p_payment text,
  p_items jsonb,
  p_reason text default 'Nachträgliche Korrektur'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_receipt public.receipts%rowtype;
  v_old_snapshot jsonb;
  v_new_snapshot jsonb;
  v_total numeric(10,2);
  v_item jsonb;
  v_item_id bigint;
  v_kept_ids bigint[] := array[]::bigint[];
  v_new_id bigint;
begin
  if p_payment not in ('Bar','EC','PayPal') then
    raise exception 'Ungültige Zahlungsart.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Der Bon muss mindestens einen Artikel enthalten.';
  end if;

  select * into v_receipt
  from public.receipts
  where id = p_receipt_id
  for update;
  if not found then
    raise exception 'Kassenbon wurde nicht gefunden.';
  end if;

  select jsonb_build_object(
    'id', v_receipt.id,
    'receipt_no', v_receipt.receipt_no,
    'register_id', v_receipt.register_id,
    'payment', v_receipt.payment,
    'total', v_receipt.total,
    'created_at', v_receipt.created_at,
    'receipt_items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.id)
      from public.receipt_items i where i.receipt_id = v_receipt.id
    ), '[]'::jsonb)
  ) into v_old_snapshot;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if nullif(v_item->>'size','') is null
       or coalesce((v_item->>'price')::numeric, -1) < 0
       or coalesce((v_item->>'commission_rate')::numeric, -1) < 0
       or coalesce((v_item->>'commission_rate')::numeric, 2) > 1 then
      raise exception 'Ungültige Artikel- oder Provisionsdaten.';
    end if;

    v_item_id := nullif(v_item->>'id','')::bigint;
    if v_item_id is not null and exists (
      select 1 from public.receipt_items
      where id = v_item_id and receipt_id = v_receipt.id
    ) then
      update public.receipt_items
      set seller_number = nullif(v_item->>'seller_number',''),
          unassigned_note = coalesce(v_item->>'unassigned_note',''),
          size = v_item->>'size',
          price = (v_item->>'price')::numeric,
          commission_enabled = coalesce((v_item->>'commission_enabled')::boolean,true),
          commission_rate = coalesce((v_item->>'commission_rate')::numeric,0.15)
      where id = v_item_id and receipt_id = v_receipt.id;
      v_new_id := v_item_id;
    else
      insert into public.receipt_items(
        receipt_id,seller_number,unassigned_note,size,price,commission_enabled,commission_rate
      ) values (
        v_receipt.id,
        nullif(v_item->>'seller_number',''),
        coalesce(v_item->>'unassigned_note',''),
        v_item->>'size',
        (v_item->>'price')::numeric,
        coalesce((v_item->>'commission_enabled')::boolean,true),
        coalesce((v_item->>'commission_rate')::numeric,0.15)
      ) returning id into v_new_id;
    end if;
    v_kept_ids := array_append(v_kept_ids, v_new_id);
  end loop;

  delete from public.receipt_items
  where receipt_id = v_receipt.id
    and not (id = any(v_kept_ids));

  select coalesce(sum(price),0)::numeric(10,2)
  into v_total
  from public.receipt_items where receipt_id = v_receipt.id;

  update public.receipts
  set payment = p_payment, total = v_total
  where id = v_receipt.id;

  select jsonb_build_object(
    'payment', p_payment,
    'total', v_total,
    'receipt_items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.id)
      from public.receipt_items i where i.receipt_id = v_receipt.id
    ), '[]'::jsonb)
  ) into v_new_snapshot;

  insert into public.receipt_edit_history(
    receipt_id,reason,old_snapshot,new_snapshot
  ) values (
    v_receipt.id,coalesce(nullif(trim(p_reason),''),'Nachträgliche Korrektur'),
    v_old_snapshot,v_new_snapshot
  );

  return jsonb_build_object('ok',true,'receipt_id',v_receipt.id,'total',v_total);
end;
$$;

revoke all on function public.kb_edit_receipt(bigint,text,jsonb,text) from public;
grant execute on function public.kb_edit_receipt(bigint,text,jsonb,text) to anon, authenticated;
