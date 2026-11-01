(()=>{'use strict';
const cfg={
base:{web:249,app:790,system:690},section:40,
plans:{essential:{type:'web',design:0,sections:1,features:[]},business:{type:'web',design:0,sections:3,features:[2,3]},custom:{type:'system',design:0,sections:1,features:[]}},
extras:{
domain:{label:'Dominio .com (referencial)',value:75,cycle:'annual',detail:'Costo del primer año y renovación de referencia; depende del registrador y extensión.'},
hosting:{label:'Hosting básico',value:120,cycle:'annual',detail:'Costo anual orientativo de alojamiento; capacidad según proyecto.'},
maintenanceBasic:{label:'Mantenimiento básico',value:30,cycle:'monthly',detail:'Cambios pequeños y revisión acordada; alcance por confirmar.'},
maintenanceAdvanced:{label:'Mantenimiento avanzado',value:70,cycle:'monthly',detail:'Más actualizaciones y revisión; alcance por confirmar.'},
copy:{label:'Redacción de textos',value:50,cycle:'once',detail:'Redacción inicial de textos básicos; textos extensos se evalúan aparte.'},
products:{label:'Carga de productos (cada 10)',value:50,cycle:'once',detail:'Carga de productos con materiales suministrados por el cliente.'},
maps:{label:'Configuración de mapa',value:30,cycle:'once',detail:'Insertar y configurar mapa o enlace; servicios de terceros aparte.'},
logo:{label:'Diseño de logotipo básico',value:80,cycle:'once',detail:'Propuesta gráfica básica con alcance y revisiones acordados.'}
},
quoteId:()=> 'AL-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+Math.random().toString(36).slice(2,6).toUpperCase()
};
cfg.computeExtras=function(picks){const setup=[],annual=[],monthly=[];const add=(id,quantity=1)=>{const x=cfg.extras[id];if(!x||quantity<=0)return;const line={id,label:x.label,price:x.value*quantity,quantity,cycle:x.cycle};(x.cycle==='once'?setup:x.cycle==='annual'?annual:monthly).push(line)};
if(picks.domain)add('domain');if(picks.hosting)add('hosting');if(picks.copy)add('copy');if(picks.products)add('products',Math.min(30,Math.max(0,Number(picks.products)||0)));if(picks.maps)add('maps');if(picks.logo)add('logo');if(picks.maintenance==='basic')add('maintenanceBasic');if(picks.maintenance==='advanced')add('maintenanceAdvanced');
const sum=xs=>xs.reduce((n,x)=>n+x.price,0);return {setup,annual,monthly,setupTotal:sum(setup),annualTotal:sum(annual),monthlyTotal:sum(monthly)}};
window.AptitudPricing=cfg;window.AptitudQuoteState=null;window.AptitudMoney=n=>'S/ '+Number(n).toLocaleString('es-PE')
})();