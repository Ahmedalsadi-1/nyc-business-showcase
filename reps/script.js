'use strict';
const slug=new URLSearchParams(location.search).get('business');
const business=window.BUSINESSES.find(b=>b.slug===slug);
if(!business){document.getElementById('scriptError').hidden=false;}else{
 const set=(id,text)=>document.getElementById(id).textContent=text;
 document.getElementById('scriptContent').hidden=false;
 document.title=business.name+' · Pitch script';set('scriptName',business.name);set('scriptAddress',business.address);set('scriptCategory',business.category+' · '+business.borough);
 document.getElementById('scriptBooking').href='../sites/'+business.slug+'/booking.html';document.getElementById('scriptWebsite').href='../sites/'+business.slug+'/index.html';document.getElementById('scriptProposal').href='../proposals/'+business.slug+'.html';
 set('scriptOpening','“Hi, are you the owner or manager of '+business.name+'? We prepared a website concept specifically for your business. Could I show you how a customer would see it on their phone?”');
 const category=business.category.toLowerCase();
 const demo=business.inventory?'Open the collection. Search for an item, filter a category and open its details. Explain: “These products are examples. Your real products, prices and availability would replace them, so customers can see what you carry before visiting.”':/auto|car |tire|mechanic/.test(category)?'Show the service pages and vehicle enquiry tool. Ask: “Would it help if a customer could describe what they need before calling?” Explain that availability and repair quotes still need the shop’s confirmation.':/event|party|balloon|cater/.test(category)?'Show the event photographs and enquiry tool. Ask: “What would you need a customer to tell you about their date and event before a conversation?” An enquiry does not confirm event availability.':/hair|barber|nail|beauty|salon|spa|tattoo/.test(category)?'Show the business photographs, service pages and enquiry tool. Ask: “What would help someone choose their next visit?” Explain how a customer can prepare a request and contact the business; it is not a confirmed appointment.':'Show the business photographs, services and enquiry tool. Use the owner’s answer to choose which feature to demonstrate, then show how a customer can contact the business.';
 set('scriptDemo',demo);
}
