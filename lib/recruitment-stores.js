// One shared form value; selecting several destinations never submits several applications.
window.installRecruitmentStores=function(container,input,field,tx,conditions){
 input.type='hidden';input.value='[]';container.className='full-width su-store-field';
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
   const text=document.createElement('span');text.textContent=choice.label;label.append(check,text);grid.append(label);rows.push({choice,label,check});check.addEventListener('change',()=>{update();conditions();});
  }
 }
 function update(){
  const selected=rows.filter(r=>r.check.checked);input.value=JSON.stringify(selected.map(r=>r.choice.value));
  search.placeholder=tx('Search store name or code','搜索门店名称或代码');search.setAttribute('aria-label',tx('Search preferred stores','搜索意向门店'));
  search.setCustomValidity(selected.length?'':tx('Select at least one preferred store or Office.','请选择至少一个意向门店或办公室。'));
  summary.replaceChildren();const count=document.createElement('span');count.textContent=selected.length+' '+tx('selected','个已选');summary.append(count);
  for(const r of selected){const chip=document.createElement('button');chip.type='button';chip.className='su-store-chip';chip.textContent=r.choice.value+' ×';chip.setAttribute('aria-label',tx('Remove ','取消选择 ')+r.choice.label);chip.addEventListener('click',()=>{r.check.checked=false;update();conditions();});summary.append(chip);}
  const query=search.value.trim().toLowerCase();for(const r of rows)r.label.hidden=!r.choice.label.toLowerCase().includes(query)&&!r.choice.group.toLowerCase().includes(query);
  for(const section of sections)section.hidden=![...section.querySelectorAll('.su-store-choice')].some(l=>!l.hidden);
  empty.hidden=rows.some(r=>!r.label.hidden);empty.textContent=tx('No matching stores. Try a store name or code.','没有匹配门店，请更换名称或代码。');
 }
 search.addEventListener('input',update);container.append(search,summary,list,empty);update();return update;
};
