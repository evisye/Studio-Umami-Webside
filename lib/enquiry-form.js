(() => {
  'use strict';
  const kind = document.body.dataset.enquiryKind;
  const careers = kind === 'careers';
  const fields = careers ? [
    ['firstName','First name','名'],['lastName','Last name','姓'],['email','Email','邮箱'],['phone','Contact number','联系电话'],
    ['visaStatus','Visa / work rights status','签证／工作权利状态'],['workStatus','Work status (full-time, part-time or casual)','工作类型（全职／兼职／临时）'],
    ['restaurant','Preferred restaurant (optional)','意向餐厅（选填）'],['mobility','Mobility / preferred work locations','可工作区域／流动意向'],
    ['position','Position','意向岗位'],['startDate','Available start date','可开始日期'],['notes','Notes (optional)','备注（选填）']
  ] : [
    ['fullName','Full name','姓名'],['company','Company / restaurant name','公司／餐厅名称'],['address','Delivery address','配送地址'],
    ['position','Position / role','职位'],['email','Email','邮箱'],['phone','Contact number','联系电话'],['notes','Notes (optional)','备注（选填）']
  ];
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
  fields.forEach(([id]) => {
    const label = document.createElement('label');
    if (['notes','address'].includes(id)) label.className = 'full-width';
    const span = document.createElement('span'); span.id = 'label-'+id;
    const input = document.createElement(id === 'notes' ? 'textarea' : 'input');
    input.name = id; input.required = !['notes','restaurant'].includes(id);
    input.maxLength = id === 'notes' ? 3000 : id === 'address' ? 500 : 200;
    if (id === 'notes') input.rows = 4;
    else input.type = id === 'email' ? 'email' : id === 'phone' ? 'tel' : id === 'startDate' ? 'date' : 'text';
    input.autocomplete = ({firstName:'given-name',lastName:'family-name',fullName:'name',email:'email',phone:'tel',company:'organization'})[id] || 'off';
    label.append(span,input); byId('fields').append(label);
  });
  byId('resume-field').hidden = !careers;
  byId('resume').required = careers;
  byId('resume').disabled = !careers;
  function translate() {
    document.documentElement.lang = language === 'en' ? 'en-AU' : 'zh-CN';
    byId('language').textContent = tx('中文','English');
    byId('brand').textContent = careers ? 'Umami People' : 'Uncle Chen Logistics';
    byId('title').textContent = careers ? tx('Join our team','求职意向登记') : tx('Fresh supply enquiry','陈叔送菜意向登记');
    byId('intro').textContent = careers ? tx('Tell us about yourself and the role you are looking for. Our team will review your details and contact you about suitable opportunities.','请填写个人情况和意向岗位，我们会查看登记资料并联系合适的候选人。') : tx('Tell us about your restaurant and delivery location. Our team will contact you to discuss fresh produce, service coverage and delivery arrangements.','请填写餐厅资料和配送地址，我们会联系您沟通蔬果供应、服务范围和配送安排。');
    fields.forEach(([id,en,zh]) => {byId('label-'+id).textContent = tx(en,zh)+(!['notes','restaurant'].includes(id)?' *':'');});
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
      data.set('payload',JSON.stringify(Object.fromEntries(fields.map(([id])=>[id,String(data.get(id)||'')]))));
      const response = await fetch('https://su.851005.xyz/api/public-enquiries/'+kind,{method:'POST',credentials:'omit',headers:{'X-Umami-Action':'website-enquiry'},body:data});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'SERVICE_UNAVAILABLE');
      if (!result.received || typeof result.id !== 'string') throw new Error('SERVICE_UNAVAILABLE');
      byId('reference').textContent = result.id;
      form.hidden = true; byId('success').hidden = false; byId('success').focus();
    } catch (error) {errorCode = error.message || 'SERVICE_UNAVAILABLE';}
    finally {busy = false; byId('submit').disabled = false; translate();}
  });
  translate(); form.hidden = false;
})();
