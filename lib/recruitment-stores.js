// One shared form value; selecting several destinations never submits several applications.
window.installRecruitmentStores=function(container,input,field,tx,conditions){
 const regions=field.labelEn==='Preferred regions',brand=document.body.dataset.recruitmentAudience,storesOnly=brand==='sh'||brand==='mt';
 const labels=regions?{name:['Preferred regions','意向地区'],search:['Search regions','搜索地区'],invalid:['Select at least one preferred region.','请选择至少一个意向地区。'],choose:['Select regions','选择地区'],empty:['No matching regions.','没有匹配地区。']}:{name:[field.labelEn,field.labelZh],search:['Search store name or code','搜索门店名称或代码'],invalid:['Select at least one preferred store'+(storesOnly?'': ' or Office')+'.','请选择至少一个意向门店'+(storesOnly?'':'或办公室')+'。'],choose:[storesOnly?'Select stores':'Select stores / Office',storesOnly?'选择门店':'选择门店／办公室'],empty:['No matching stores. Try a store name or code.','没有匹配门店，请更换名称或代码。']};
 input.type='hidden';input.value='[]';container.className='full-width su-store-field';
 const dropdown=document.createElement('details');dropdown.className='su-store-dropdown';
 const trigger=document.createElement('summary');trigger.className='su-store-trigger';const title=document.createElement('span');trigger.append(title);dropdown.append(trigger);
 const panel=document.createElement('div');panel.className='su-store-panel';dropdown.append(panel);
 const validator=document.createElement('input');validator.className='su-selection-validator';validator.tabIndex=-1;validator.setAttribute('aria-label',tx(...labels.name));validator.addEventListener('invalid',()=>{dropdown.open=true;search.focus();});
 const search=document.createElement('input');search.type='search';search.className='su-store-search';search.autocomplete='off';
 const summary=document.createElement('div');summary.className='su-store-selected';summary.setAttribute('aria-live','polite');
 const list=document.createElement('div');list.className='su-store-list';list.setAttribute('role','group');list.setAttribute('aria-labelledby','label-'+field.id);list.setAttribute('aria-required','true');
 const empty=document.createElement('p');empty.className='su-store-empty';empty.hidden=true;
 const rows=[],sections=[];
 for(const group of [...new Set(field.choices.map(c=>c.group))]){
  const section=document.createElement('section'),heading=document.createElement('h3');heading.textContent=group;section.append(heading);
  const grid=document.createElement('div');grid.className='su-store-grid';section.append(grid);list.append(section);sections.push(section);
  for(const choice of field.choices.filter(c=>c.group===group)){
   const label=document.createElement('label');label.className='su-store-choice';const check=document.createElement('input');check.type='checkbox';check.value=choice.value;
   const text=document.createElement('span');text.textContent=choice.label;label.append(check,text);grid.append(label);rows.push({choice,label,check,text});check.addEventListener('change',()=>{update();conditions();});
  }
 }
 function update(){
  const selected=rows.filter(r=>r.check.checked);input.value=JSON.stringify(selected.map(r=>r.choice.value));
  search.placeholder=tx(...labels.search);search.setAttribute('aria-label',tx(...labels.search));validator.setAttribute('aria-label',tx(...labels.name));for(const r of rows)r.text.textContent=tx(r.choice.label,r.choice.labelZh||r.choice.label);
  validator.value=selected.length?'selected':'';validator.setCustomValidity(selected.length?'':tx(...labels.invalid));
  title.textContent=selected.length?selected.length+' '+tx('selected','个已选')+' — '+tx(...labels.choose):tx(...labels.choose);summary.hidden=!selected.length;summary.replaceChildren();
  for(const r of selected){const chip=document.createElement('button');chip.type='button';chip.className='su-store-chip';chip.textContent=r.choice.value+' ×';chip.setAttribute('aria-label',tx('Remove ','取消选择 ')+r.choice.label);chip.addEventListener('click',()=>{r.check.checked=false;update();conditions();});summary.append(chip);}
  const query=search.value.trim().toLowerCase();for(const r of rows)r.label.hidden=!r.choice.label.toLowerCase().includes(query)&&!r.choice.group.toLowerCase().includes(query)&&!(r.choice.labelZh||'').toLowerCase().includes(query);
  for(const section of sections)section.hidden=![...section.querySelectorAll('.su-store-choice')].some(l=>!l.hidden);
  empty.hidden=rows.some(r=>!r.label.hidden);empty.textContent=tx(...labels.empty);
 }
 const done=document.createElement('button');done.type='button';done.className='su-store-done';done.addEventListener('click',()=>{dropdown.open=false;trigger.focus();});
 search.addEventListener('input',update);panel.append(search,list,empty,done);container.append(validator,dropdown,summary);
 dropdown.addEventListener('toggle',()=>{trigger.setAttribute('aria-expanded',String(dropdown.open));if(dropdown.open)search.focus();});
 container.addEventListener('keydown',e=>{if(e.key==='Escape'&&dropdown.open){e.preventDefault();dropdown.open=false;trigger.focus();}});
 document.addEventListener('click',e=>{if(!container.contains(e.target))dropdown.open=false;});
 const refresh=()=>{update();done.textContent=tx('Done','完成');};refresh();return refresh;
};
