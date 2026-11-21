/* Katyayani: question definitions and order. 
Keep IDs stable for shared integration. */
window.VAGMITRA_QUESTIONS = [
  { id:"fullName", step:1, title:"Personal details", prompt:"What is your full name?",
     label:"Full name", type:"text", required:true,
      placeholder:"Enter your full name", autocomplete:"name" },

  { id:"dateOfBirth", step:1, title:"Personal details", prompt:"What is your date of birth?",
     label:"Date of birth", type:"date", required:true },

  { id:"phone", step:2, title:"Contact details", prompt:"What phone number can we use to contact you?",
     label:"Mobile number", type:"tel", required:true, placeholder:"10-digit mobile number", autocomplete:"tel" },

  { id:"email", step:2, title:"Contact details", 
    prompt:"What is your email address? You can leave this blank if you do not use email.", 
    label:"Email address (optional)", type:"email", required:false, placeholder:"name@example.com", 
    autocomplete:"email" },

  { id:"address", step:3, title:"Address", prompt:"What is your current residential address?",
     label:"Residential address", type:"textarea", required:true,
      placeholder:"House number, street, area, city, state and PIN code" },

  { id:"applicationType", step:4, title:"Application",
     prompt:"What service or application are you seeking help with?",
      label:"Service / application", type:"select", required:true, 
      options:["Government scheme application","Certificate or document service","Public welfare service","Other"],
       placeholder:"Choose a service" },

  { id:"purpose", step:4, title:"Application", prompt:"Please briefly describe what you need help with.",
     label:"Reason for application", type:"textarea", required:true,
      placeholder:"Describe your request in a few sentences" }
];
