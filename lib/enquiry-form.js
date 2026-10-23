(async () => {
  'use strict';
  const kind = document.body.dataset.enquiryKind;
  const careers = kind === 'careers';
  let config;
  const submitButton=document.getElementById('submit');submitButton.disabled=true;
  try {const response=await fetch('https://erp.studioumami.com.au/api/public-enquiries/'+kind,{credentials:'omit',cache:'no-store'});if(!response.ok)throw Error();config=(await response.json()).form;if(!config.active)throw Error();}
  catch {const error=document.getElementById('error');error.hidden=false;error.textContent='This form is unavailable. Please refresh or contact info@studioumami.com.au. / 表格暂不可用，请刷新或联系我们。';document.getElementById('enquiry-form').hidden=false;return;}
  const definitions=config.fields,fields=definitions.map(f=>[f.id,f.labelEn,f.labelZh]);
  const matches=(rule,values)=>!rule||(rule.equals!==undefined?values[rule.fieldId]===rule.equals:!!values[rule.fieldId]&&!rule.notIn?.includes(String(values[rule.fieldId])));
  function conditions(){const values=Object.fromEntries(definitions.map(f=>{const input=document.getElementsByName(f.id)[0];return [f.id,f.type==='checkbox'?input.checked:input.value];}));for(const f of definitions){const input=document.getElementsByName(f.id)[0],visible=matches(f.visibleWhen,values);input.closest('[data-field]').hidden=!visible;input.closest('[data-field]').style.display=visible?'':'none';input.disabled=!visible;input.required=visible&&(f.required||!!f.requiredWhen&&matches(f.requiredWhen,values));for(const part of document.querySelectorAll('[data-date-field="'+f.id+'"] select')){part.required=input.required;part.disabled=!visible;}document.getElementById('label-'+f.id).textContent=tx(f.labelEn,f.labelZh)+(input.required?' *':'');}}
  let language = 'en', busy = false, requestId = '', errorCode = '';
  const tx = (en,zh) => language === 'en' ? en : zh;
  const byId = id => document.getElementById(id);
  const form = byId('enquiry-form');
  const messages = {
    TOO_MANY_REQUESTS:['Too many submissions. Please try again in an hour.','提交次数较多，请一小时后重试。'],
    RESUME_PDF_REQUIRED:['Please upload a valid PDF resume, up to 5 MB.','请上传不超过 5 MB 的 PDF 简历。'],
    INVALID_CONTACT:['Check your email address and contact number.','请检查邮箱与联系电话。'],
    INVALID_FIELDS:['Complete all required fields and consent.','请完整填写必填信息并确认资料用途。'],
    INVALID_DATE:['Please enter a valid start date.','请填写有效的可开始日期。'],
    REQUEST_CHANGED:['A previous submission was already received. Refresh to submit another enquiry.','之前的登记已经收到。如需重新登记，请刷新页面。'],
    SERVICE_UNAVAILABLE:['We could not save your enquiry. Your entries are still here; please try again.','暂时无法保存，已填写内容仍保留，请重试。']
  };

  const dateFields=[];
  function installDateField(label,input,field){
    input.type='hidden';
    const grid=document.createElement('div');grid.className='su-date-grid';grid.dataset.dateField=field.id;
    const parts=['day','month','year'].map(part=>{
      const select=document.createElement('select');select.dataset.part=part;
      const empty=document.createElement('option');empty.value='';select.append(empty);
      const year=new Date().getFullYear(),values=part==='year'?Array.from({length:11},(_,i)=>year-5+i):Array.from({length:part==='day'?31:12},(_,i)=>i+1);
      for(const value of values){const option=document.createElement('option');option.value=String(value);option.textContent=String(value);select.append(option);}
      grid.append(select);return select;
    });
    const update=()=>{
      const [day,month,year]=parts.map(p=>p.value);
      const iso=year&&month&&day?year+'-'+month.padStart(2,'0')+'-'+day.padStart(2,'0'):'';
      const date=new Date(iso+'T00:00:00Z'),valid=iso&&Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===iso;
      input.value=valid?iso:'';parts[0].setCustomValidity(iso&&!valid?tx('Choose a valid date.','请选择有效日期。'):'');conditions();
    };
    parts.forEach(part=>part.addEventListener('change',update));label.append(grid);dateFields.push({field,parts,update});
  }
  function translateNativeControls(){
    for(const {field,parts,update} of dateFields){
      parts.forEach((select,index)=>{
        const names=[tx('Day','日'),tx('Month','月'),tx('Year','年')];
        select.options[0].textContent=names[index];select.setAttribute('aria-label',tx(field.labelEn,field.labelZh)+' — '+names[index]);
        if(index===1)for(const option of [...select.options].slice(1))option.textContent=new Intl.DateTimeFormat(language==='en'?'en-AU':'zh-CN',{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,Number(option.value)-1,1)));
      });update();
    }
    const pick=byId('resume-pick'),name=byId('resume-name');if(pick)pick.textContent=tx('Choose PDF resume','选择 PDF 简历');
    if(name)name.textContent=byId('resume').files?.[0]?.name||tx('No file selected','未选择文件');
    const restaurant=document.querySelector('select[name=restaurant]');if(restaurant)restaurant.options[0].textContent=tx('Any store / not sure yet','门店不限／暂未确定');
  }

  definitions.forEach(field => {
    const id=field.id;
    const label = document.createElement(field.type==='date'?'fieldset':'label');label.dataset.field=id;if(field.type==='date')label.className='su-date-field';
    if (['notes','address'].includes(id)) label.className = 'full-width';
    const span = document.createElement(field.type==='date'?'legend':'span'); span.id = 'label-'+id;
    const input = document.createElement(field.type==='textarea'?'textarea':field.type==='select'?'select':'input');
    input.name = id; input.required = field.required;
    input.maxLength = id === 'notes' ? 3000 : id === 'address' ? 500 : 200;
    if (field.type === 'textarea') input.rows = 4;
    else if(field.type==='select'){for(const option of ['',...(field.options||[])]){const node=document.createElement('option');node.value=option;node.textContent=option;input.append(node);}}
    else input.type = id === 'email' ? 'email' : id === 'phone' ? 'tel' : ['date','number','checkbox'].includes(field.type)?field.type:'text';
    input.autocomplete = ({firstName:'given-name',lastName:'family-name',fullName:'name',email:'email',phone:'tel',company:'organization'})[id] || 'off';
    label.append(span,input); if(field.type==='date')installDateField(label,input,field); if(field.helpEn||field.helpZh){const help=document.createElement('small');help.id='help-'+id;label.append(help);} byId('fields').append(label);input.addEventListener('input',conditions);
  });
  byId('resume-field').hidden = !careers;
  byId('resume').required = careers;
  byId('resume').disabled = !careers;
  if(careers){
    const pick=document.createElement('button');pick.id='resume-pick';pick.type='button';pick.className='su-file-pick';pick.addEventListener('click',()=>byId('resume').click());
    const name=document.createElement('span');name.id='resume-name';name.setAttribute('role','status');
    byId('resume').className='su-file-native';byId('resume').setAttribute('aria-labelledby','resume-label');
    byId('resume-field').append(pick,name);byId('resume').addEventListener('change',translateNativeControls);
    byId('resume').addEventListener('invalid',event=>{event.preventDefault();errorCode='RESUME_PDF_REQUIRED';translate();pick.focus();});
  }
  function translate() {
    document.documentElement.lang = language === 'en' ? 'en-AU' : 'zh-CN';
    byId('language').textContent = tx('中文','English');
    byId('brand').textContent = careers ? 'Umami People' : 'Uncle Chen Logistics';
    byId('title').textContent = tx(config.titleEn,config.titleZh);
    byId('intro').textContent = tx(config.descriptionEn,config.descriptionZh);
    conditions();translateNativeControls();definitions.forEach(f=>{const help=byId('help-'+f.id);if(help)help.textContent=tx(f.helpEn||'',f.helpZh||'');});
    byId('resume-label').textContent = tx('Resume (PDF, up to 5 MB) *','简历（PDF，不超过 5 MB）*');
    byId('privacy').textContent = tx('Your details will be stored in Studio Umami’s system and accessed by authorised office staff to respond to this enquiry. For questions or a correction, contact info@studioumami.com.au.','资料将存入 Studio Umami 系统，由获授权的办公室人员用于处理此次登记。如有问题或需更正资料，请联系 info@studioumami.com.au。');
    byId('consent-label').textContent = tx('I agree that Studio Umami may use these details to respond to this enquiry.','我同意 Studio Umami 使用以上资料联系我并处理此次登记。');
    byId('submit').textContent = busy ? tx('Submitting…','正在提交…') : tx('Submit enquiry','提交登记');
    byId('success-title').textContent = tx('Thank you — your enquiry has been received.','谢谢，您的登记已收到。');
    byId('success-text').textContent = tx('Our team will follow up using the contact details you provided.','工作人员会通过您提供的联系方式跟进。');
    byId('reference-label').textContent = tx('Reference','登记编号');
    byId('back-home').textContent = tx('Back to Studio Umami','返回官网');
    byId('error').hidden = !errorCode;
    byId('error').textContent = errorCode ? tx(...(messages[errorCode] || messages.SERVICE_UNAVAILABLE)) : '';
  }
  byId('language').addEventListener('click',()=>{language = language === 'en' ? 'zh' : 'en'; translate();});
  form.addEventListener('submit',async event => {
    event.preventDefault(); if (busy) return;
    busy = true; errorCode = ''; byId('submit').disabled = true; translate();
    try {
      const data = new FormData(form);
      if (careers) {const file = data.get('resume'); if (!file || file.size > 5*1024*1024 || file.size < 5 || !file.name.toLowerCase().endsWith('.pdf')) throw new Error('RESUME_PDF_REQUIRED');}
      if (!requestId) requestId = crypto.randomUUID();
      data.set('requestId',requestId);
      data.set('payload',JSON.stringify(Object.fromEntries(definitions.filter(f=>!document.getElementsByName(f.id)[0].disabled).map(f=>[f.id,f.type==='checkbox'?data.get(f.id)==='on':String(data.get(f.id)||'')]))));
      const response = await fetch('https://erp.studioumami.com.au/api/public-enquiries/'+kind,{method:'POST',credentials:'omit',headers:{'X-Umami-Action':'website-enquiry'},body:data});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'SERVICE_UNAVAILABLE');
      if (!result.received || typeof result.id !== 'string') throw new Error('SERVICE_UNAVAILABLE');
      byId('reference').textContent = result.id;
      form.hidden = true; byId('success').hidden = false; byId('success').focus();
    } catch (error) {errorCode = error.message || 'SERVICE_UNAVAILABLE';}
    finally {busy = false; byId('submit').disabled = false; translate();}
  });
  translate(); form.hidden = false;submitButton.disabled=false;
})();
