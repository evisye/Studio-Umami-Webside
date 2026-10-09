(async () => {
  'use strict';
  const kind = document.body.dataset.enquiryKind;
  const careers = kind === 'careers';
  let config;
  const submitButton=document.getElementById('submit');submitButton.disabled=true;
  try {const response=await fetch('https://su.851005.xyz/api/public-enquiries/'+kind,{credentials:'omit',cache:'no-store'});if(!response.ok)throw Error();config=(await response.json()).form;if(!config.active)throw Error();}
  catch {const error=document.getElementById('error');error.hidden=false;error.textContent='This form is unavailable. Please refresh or contact info@studioumami.com.au. / 表格暂不可用，请刷新或联系我们。';document.getElementById('enquiry-form').hidden=false;return;}
  const definitions=config.fields,fields=definitions.map(f=>[f.id,f.labelEn,f.labelZh]);
  const matches=(rule,values)=>!rule||(rule.equals!==undefined?values[rule.fieldId]===rule.equals:!!values[rule.fieldId]&&!rule.notIn?.includes(String(values[rule.fieldId])));
  function conditions(){const values=Object.fromEntries(definitions.map(f=>{const input=document.getElementsByName(f.id)[0];return [f.id,f.type==='checkbox'?input.checked:input.value];}));for(const f of definitions){const input=document.getElementsByName(f.id)[0],visible=matches(f.visibleWhen,values);input.closest('label').hidden=!visible;input.closest('label').style.display=visible?'':'none';input.disabled=!visible;input.required=visible&&(f.required||!!f.requiredWhen&&matches(f.requiredWhen,values));document.getElementById('label-'+f.id).textContent=tx(f.labelEn,f.labelZh)+(input.required?' *':'');}}
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
  definitions.forEach(field => {
    const id=field.id;
    const label = document.createElement('label');
    if (['notes','address'].includes(id)) label.className = 'full-width';
    const span = document.createElement('span'); span.id = 'label-'+id;
    const input = document.createElement(field.type==='textarea'?'textarea':field.type==='select'?'select':'input');
    input.name = id; input.required = field.required;
    input.maxLength = id === 'notes' ? 3000 : id === 'address' ? 500 : 200;
    if (field.type === 'textarea') input.rows = 4;
    else if(field.type==='select'){for(const option of ['',...(field.options||[])]){const node=document.createElement('option');node.value=option;node.textContent=option;input.append(node);}}
    else input.type = id === 'email' ? 'email' : id === 'phone' ? 'tel' : ['date','number','checkbox'].includes(field.type)?field.type:'text';
    input.autocomplete = ({firstName:'given-name',lastName:'family-name',fullName:'name',email:'email',phone:'tel',company:'organization'})[id] || 'off';
    label.append(span,input); if(field.helpEn||field.helpZh){const help=document.createElement('small');help.id='help-'+id;label.append(help);} byId('fields').append(label);input.addEventListener('input',conditions);
  });
  byId('resume-field').hidden = !careers;
  byId('resume').required = careers;
  byId('resume').disabled = !careers;
  function translate() {
    document.documentElement.lang = language === 'en' ? 'en-AU' : 'zh-CN';
    byId('language').textContent = tx('中文','English');
    byId('brand').textContent = careers ? 'Umami People' : 'Uncle Chen Logistics';
    byId('title').textContent = tx(config.titleEn,config.titleZh);
    byId('intro').textContent = tx(config.descriptionEn,config.descriptionZh);
    conditions();definitions.forEach(f=>{const help=byId('help-'+f.id);if(help)help.textContent=tx(f.helpEn||'',f.helpZh||'');});
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
      const response = await fetch('https://su.851005.xyz/api/public-enquiries/'+kind,{method:'POST',credentials:'omit',headers:{'X-Umami-Action':'website-enquiry'},body:data});
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
