window.installRecruitmentDate=function(container,input,field,tx,conditions){
 input.type='hidden';container.className='su-date-field su-calendar-field';
 const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const today=new Date();input.value=iso(today);let month=today.getMonth(),year=today.getFullYear();
 const trigger=document.createElement('button');trigger.type='button';trigger.className='su-calendar-trigger';trigger.setAttribute('aria-expanded','false');
 const popup=document.createElement('div');popup.className='su-calendar';popup.hidden=true;popup.setAttribute('role','group');
 const nav=document.createElement('div');nav.className='su-calendar-nav';const prev=document.createElement('button'),next=document.createElement('button'),months=document.createElement('select'),years=document.createElement('select');
 prev.type=next.type='button';prev.textContent='‹';next.textContent='›';
 for(let i=0;i<12;i++){const o=document.createElement('option');o.value=i;months.append(o);}
 for(let i=today.getFullYear()-5;i<=today.getFullYear()+10;i++){const o=document.createElement('option');o.value=i;o.textContent=i;years.append(o);}
 nav.append(prev,months,years,next);const days=document.createElement('div');days.className='su-calendar-days';const now=document.createElement('button');now.type='button';now.className='su-calendar-today';popup.append(nav,days,now);container.append(trigger,popup);
 const close=()=>{popup.hidden=true;trigger.setAttribute('aria-expanded','false');};
 function pick(value){input.value=value;close();update();conditions();trigger.focus();}
 function update(){
  const locale=tx('en-AU','zh-CN');trigger.textContent=new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',year:'numeric'}).format(new Date(input.value+'T12:00:00'));trigger.setAttribute('aria-label',tx('Choose available start date','选择可开始日期')+': '+trigger.textContent);
  popup.setAttribute('aria-label',tx('Available start date calendar','可开始日期日历'));prev.setAttribute('aria-label',tx('Previous month','上个月'));next.setAttribute('aria-label',tx('Next month','下个月'));months.setAttribute('aria-label',tx('Calendar month','日历月份'));years.setAttribute('aria-label',tx('Calendar year','日历年份'));now.textContent=tx('Today','今天');
  [...months.options].forEach((o,i)=>o.textContent=new Intl.DateTimeFormat(locale,{month:'short'}).format(new Date(2026,i,1)));months.value=month;years.value=year;
  prev.disabled=year===today.getFullYear()-5&&month===0;next.disabled=year===today.getFullYear()+10&&month===11;
  days.replaceChildren();for(const text of tx('Mon,Tue,Wed,Thu,Fri,Sat,Sun','一,二,三,四,五,六,日').split(',')){const h=document.createElement('span');h.textContent=text;days.append(h);}
  const start=(new Date(year,month,1).getDay()+6)%7;for(let i=0;i<start;i++)days.append(document.createElement('span'));
  for(let day=1;day<=new Date(year,month+1,0).getDate();day++){const date=new Date(year,month,day),value=iso(date),b=document.createElement('button');b.type='button';b.textContent=day;b.setAttribute('aria-label',new Intl.DateTimeFormat(locale,{day:'numeric',month:'long',year:'numeric'}).format(date));b.setAttribute('aria-pressed',String(value===input.value));if(value===iso(today))b.setAttribute('aria-current','date');b.addEventListener('click',()=>pick(value));days.append(b);}
 }
 trigger.addEventListener('click',()=>{popup.hidden=!popup.hidden;trigger.setAttribute('aria-expanded',String(!popup.hidden));update();});
 prev.addEventListener('click',()=>{if(--month<0){month=11;year--;}update();});next.addEventListener('click',()=>{if(++month>11){month=0;year++;}update();});months.addEventListener('change',()=>{month=Number(months.value);update();});years.addEventListener('change',()=>{year=Number(years.value);update();});now.addEventListener('click',()=>{month=today.getMonth();year=today.getFullYear();pick(iso(today));});
 container.addEventListener('keydown',e=>{if(e.key==='Escape'){close();trigger.focus();}});document.addEventListener('click',e=>{if(!container.contains(e.target))close();});update();return {update};
};
window.installWorkTypes=function(container,input,field,tx,conditions){
 input.type='hidden';input.value='[]';container.className='su-work-field';const dropdown=document.createElement('details');dropdown.className='su-work-select';const summary=document.createElement('summary');dropdown.append(summary);const rows=[];
 for(const choice of field.choices){const label=document.createElement('label');label.className='su-work-choice';const check=document.createElement('input');check.type='checkbox';check.value=choice.value;const span=document.createElement('span');label.append(check,span);dropdown.append(label);rows.push({check,span,choice});check.addEventListener('change',()=>{update();conditions();});}
 const hiddenValidator=document.createElement('input');hiddenValidator.type='text';hiddenValidator.tabIndex=-1;hiddenValidator.className='su-selection-validator';hiddenValidator.setAttribute('aria-hidden','true');hiddenValidator.addEventListener('invalid',e=>{e.preventDefault();dropdown.open=true;rows[0].check.focus();});container.append(dropdown,hiddenValidator);
 function update(){const selected=rows.filter(r=>r.check.checked);input.value=JSON.stringify(selected.map(r=>r.choice.value));summary.textContent=selected.length?selected.map(r=>r.choice.label).join(', '):tx('Select work types','选择工作类型');for(const r of rows)r.span.textContent=tx(r.choice.label,({'Full-time':'全职','Part-time':'兼职','Casual':'临时'})[r.choice.value]||r.choice.label);hiddenValidator.setCustomValidity(selected.length?'':tx('Select at least one work type.','请选择至少一种工作类型。'));}
 document.addEventListener('click',e=>{if(!container.contains(e.target))dropdown.open=false;});update();return update;
};
