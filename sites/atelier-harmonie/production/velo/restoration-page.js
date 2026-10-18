import { seoMarkup } from 'public/atelier-restoration-seo';
import { restorationFormConfig as config } from 'public/atelier-restoration-form-config';

$w.onReady(function(){
 const element=$w('#customElement10');
 element.seoMarkup=seoMarkup;
 const state=(status)=>element.setAttribute('contact-state',JSON.stringify({status,at:Date.now()}));
 state('unavailable');
 if(!config.enabled||!config.elementId||Object.values(config.fields).some(v=>!v))return;
 let form;
 try{form=$w(config.elementId);}catch{return;}
 if(typeof form?.setFieldValues!=='function'||typeof form?.getFieldValues!=='function'||typeof form?.submit!=='function')return;
 let pending=false;
 const success=()=>{pending=false;state('success');};
 form.onSubmitSuccess(success);
 element.on('atelier-contact-submit',async event=>{
  if(pending)return;
  const values=event.detail?.values;
  if(!values||typeof values.name!=='string'||typeof values.email!=='string'||typeof values.subject!=='string'||typeof values.message!=='string')return;
  if(!values.name.trim()||values.name.length>120||values.email.length>254||!/^\S+@\S+\.\S+$/.test(values.email)||values.subject.length>200||values.message.length>5000){state('invalid');return;}
  pending=true;state('sending');
  try{
   form.setFieldValues({[config.fields.name]:values.name.trim(),[config.fields.email]:values.email.trim(),[config.fields.subject]:values.subject.trim(),[config.fields.message]:values.message.trim()});
   await form.submit();
   success();
  }catch{
   pending=false;state('native-required');
   // Preserve Wix validation and any interactive challenge; never bypass it.
   await form.expand();
   await form.scrollTo();
  }
 });
 // The native widget remains available for validation/challenges. Do not
 // automatically hide or remove it before the end-to-end flow is confirmed.
 if(config.collapseNative)form.collapse();
 state('ready');
});
