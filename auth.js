/* Kleiderbörse – Rollen-Zugang
   Hinweis: Diese Zugangskontrolle schützt die Navigation im Browser.
   Für echte serverseitige Sicherheit müssen zusätzlich Supabase-RLS/Benutzerrechte
   eingerichtet werden. */
(function(){
  const ROLE_KEY='kb_role';
  const REGISTER_KEY='kb_register';
  const PASSWORDS={
    cashier:'Kasse!47Mond#',
    accounting:'Buch!83Wald#'
  };

  function role(){return sessionStorage.getItem(ROLE_KEY)||''}
  function setRole(r){sessionStorage.setItem(ROLE_KEY,r)}
  function logout(){sessionStorage.removeItem(ROLE_KEY);sessionStorage.removeItem(REGISTER_KEY);window.location.href='index.html'}
  function requireRole(allowed){
    const r=role();
    if(!allowed.includes(r)){
      window.location.replace('index.html');
      return false;
    }
    return true;
  }
  function login(password){
    if(password===PASSWORDS.cashier){setRole('cashier');return 'cashier'}
    if(password===PASSWORDS.accounting){setRole('accounting');return 'accounting'}
    return '';
  }
  function selectedRegister(){return sessionStorage.getItem(REGISTER_KEY)||''}
  function setRegister(n){sessionStorage.setItem(REGISTER_KEY,String(n))}
  window.KBAuth={role,setRole,logout,requireRole,login,selectedRegister,setRegister};
})();
