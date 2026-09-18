function revealAll(){document.querySelectorAll('.reveal').forEach(function(el){el.style.opacity='1';el.style.transform='none';el.style.filter='none';el.style.visibility='visible';});}
    window.addEventListener('error',revealAll);
    document.addEventListener('DOMContentLoaded',revealAll);
    setTimeout(revealAll,500);
