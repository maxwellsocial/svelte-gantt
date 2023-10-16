import{s as z,f as h,a as w,g as _,h as U,c as D,d as M,j as p,i as A,r as c,u as T,v as S,w as q,x as R,y as F,z as V,A as J,B as K,C as Q,D as H,E as X}from"../chunks/scheduler.bd64f757.js";import{S as B,i as G,b as Z,d as tt,m as et,a as L,t as P,e as st}from"../chunks/index.86590fdc.js";import{t as W,o as x,s as j}from"../chunks/utils.1c822e9e.js";import{b as g}from"../chunks/paths.199b1648.js";const nt=!0,ot=!1,vt=Object.freeze(Object.defineProperty({__proto__:null,prerender:nt,ssr:ot},Symbol.toStringTag,{value:"Module"}));function at(a){let t,n,e,r,d,s,f,v,i,o;return{c(){t=h("div"),n=h("input"),e=w(),r=h("input"),d=w(),s=h("input"),f=w(),v=h("input"),this.h()},l(b){t=_(b,"DIV",{class:!0});var l=U(t);n=_(l,"INPUT",{type:!0,class:!0}),e=D(l),r=_(l,"INPUT",{type:!0,class:!0}),d=D(l),s=_(l,"INPUT",{type:!0,class:!0}),f=D(l),v=_(l,"INPUT",{type:!0,class:!0}),l.forEach(M),this.h()},h(){p(n,"type","button"),n.value="<",p(n,"class","svelte-et6px4"),p(r,"type","button"),r.value="Day view",p(r,"class","svelte-et6px4"),p(s,"type","button"),s.value=">",p(s,"class","svelte-et6px4"),p(v,"type","button"),v.value="Week view",p(v,"class","svelte-et6px4"),p(t,"class","view-navigation")},m(b,l){A(b,t,l),c(t,n),c(t,e),c(t,r),c(t,d),c(t,s),c(t,f),c(t,v),i||(o=[T(n,"click",a[3]),T(r,"click",a[0]),T(s,"click",a[2]),T(v,"click",a[1])],i=!0)},p:S,i:S,o:S,d(b){b&&M(t),i=!1,q(o)}}}function lt(a,t,n){let{options:e={from:W("06:00"),to:W("18:00")}}=t;const r=R();function d(o){r("updateOptions",o)}function s(){console.log("day view set"),d({fitWidth:!0,columnUnit:"minute",columnOffset:15,from:e.from,to:e.to,minWidth:1e3,headers:[{unit:"day",format:"DD.MM.YYYY"},{unit:"hour",format:"HH"}]})}function f(){console.log("week view set"),d({fitWidth:!1,columnUnit:"hour",columnOffset:1,from:e.from.clone().startOf("week"),to:e.from.clone().endOf("week"),minWidth:5e3,headers:[{unit:"month",format:"MMMM YYYY",sticky:!0},{unit:"day",format:"ddd DD",sticky:!0}]})}function v(){console.log("set next day"),d({from:e.from.clone().add(1,"day"),to:e.to.clone().add(1,"day")})}function i(){console.log("set previous day"),d({from:e.from.clone().subtract(1,"day"),to:e.to.clone().subtract(1,"day")})}return a.$$set=o=>{"options"in o&&n(4,e=o.options)},[s,f,v,i,e]}class it extends B{constructor(t){super(),G(this,t,lt,at,z,{options:4})}}function ut(a){let t,n,e,r='<a href="https://github.com/ANovokmet/svelte-gantt" class="svelte-ful2sl">Svelte-gantt</a>',d,s,f,v=`<a href="${g}/large-dataset"><button type="button" class="svelte-ful2sl">LargeDataset</button></a> <a href="${g}/dependencies"><button type="button" class="svelte-ful2sl">Dependencies</button></a> <a href="${g}/tree"><button type="button" class="svelte-ful2sl">Tree</button></a> <a href="${g}/external"><button type="button" class="svelte-ful2sl">External</button></a> <a href="${g}/events"><button type="button" class="svelte-ful2sl">Events</button></a> <a href="${g}/multiple-charts"><button type="button" class="svelte-ful2sl">Multiple gantt</button></a> <a href="${g}/svelte-component"><button type="button" class="svelte-ful2sl">Usage as svelte component</button></a> <a href="${g}/column-styles"><button type="button" class="svelte-ful2sl">Column styles</button></a>`,i,o,b,l,C="|||",E,k,I,Y;o=new it({props:{options:a[0]}}),o.$on("updateOptions",a[2]);const N=a[4].default,m=F(N,a,a[3],null);return{c(){t=h("div"),n=h("header"),e=h("div"),e.innerHTML=r,d=w(),s=h("div"),f=h("div"),f.innerHTML=v,i=w(),Z(o.$$.fragment),b=w(),l=h("button"),l.textContent=C,E=w(),m&&m.c(),this.h()},l(u){t=_(u,"DIV",{class:!0});var y=U(t);n=_(y,"HEADER",{class:!0});var $=U(n);e=_($,"DIV",{class:!0,"data-svelte-h":!0}),V(e)!=="svelte-1n5jfo9"&&(e.innerHTML=r),d=D($),s=_($,"DIV",{class:!0});var O=U(s);f=_(O,"DIV",{class:!0,"data-svelte-h":!0}),V(f)!=="svelte-kzbk5z"&&(f.innerHTML=v),i=D(O),tt(o.$$.fragment,O),b=D(O),l=_(O,"BUTTON",{class:!0,"data-svelte-h":!0}),V(l)!=="svelte-1mc8hhu"&&(l.textContent=C),O.forEach(M),$.forEach(M),E=D(y),m&&m.l(y),y.forEach(M),this.h()},h(){p(e,"class","header-title svelte-ful2sl"),p(f,"class","header-controls__row"),p(l,"class","svelte-ful2sl"),p(s,"class","header-controls svelte-ful2sl"),p(n,"class","header svelte-ful2sl"),p(t,"class","app svelte-ful2sl")},m(u,y){A(u,t,y),c(t,n),c(n,e),c(n,d),c(n,s),c(s,f),c(s,i),et(o,s,null),c(s,b),c(s,l),c(t,E),m&&m.m(t,null),k=!0,I||(Y=T(l,"click",a[5]),I=!0)},p(u,[y]){const $={};y&1&&($.options=u[0]),o.$set($),m&&m.p&&(!k||y&8)&&J(m,N,u,u[3],k?Q(N,u[3],y,null):K(u[3]),null)},i(u){k||(L(o.$$.fragment,u),L(m,u),k=!0)},o(u){P(o.$$.fragment,u),P(m,u),k=!1},d(u){u&&M(t),st(o),m&&m.d(u),I=!1,Y()}}}function rt(a,t,n){let e,r;H(a,x,i=>n(0,e=i)),H(a,j,i=>n(1,r=i));let{$$slots:d={},$$scope:s}=t;function f(i){const o=i.detail;console.log("onUpdateOptions",o),X(x,e={...e,...o},e)}const v=()=>{j.set(!r)};return a.$$set=i=>{"$$scope"in i&&n(3,s=i.$$scope)},[e,r,f,s,d,v]}class mt extends B{constructor(t){super(),G(this,t,rt,ut,z,{})}}export{mt as component,vt as universal};
