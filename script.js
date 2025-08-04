// Basic Firestore integration
let visits=[];
auth.onAuthStateChanged(user=>{
  if(user){loadVisits(user.uid);myUsernameLabel.textContent=user.email;}
});
visitForm.addEventListener('submit',async e=>{
  e.preventDefault();const user=auth.currentUser;if(!user)return;const v={name:vName.value,city:vCity.value,date:vDate.value,diners:+vDiners.value,totalPrice:+vTotal.value,notes:vNotes.value,rating:0,owner:user.uid};await db.collection('profiles').doc(user.uid).collection('visits').add(v);loadVisits(user.uid);});
async function loadVisits(uid){const snap=await db.collection('profiles').doc(uid).collection('visits').get();visits=snap.docs.map(d=>d.data());renderSummary();}
function renderSummary(){summary.innerHTML=visits.map(v=>`<div>${v.date} - ${v.name} (${v.city}) €${(v.totalPrice/v.diners).toFixed(2)}</div>`).join('');}
btnFriend.addEventListener('click',async()=>{const name=friendInput.value.trim();const snap=await db.collection('profiles').where('username','==',name).get();if(snap.empty){friendView.textContent='No encontrado';return;}const userId=snap.docs[0].id;const visitsSnap=await db.collection('profiles').doc(userId).collection('visits').get();const byCity={};visitsSnap.forEach(d=>{const v=d.data();(byCity[v.city]=byCity[v.city]||[]).push(v);});let html='';Object.keys(byCity).sort().forEach(c=>{html+=`<h4>${c}</h4><ul>`;byCity[c].sort((a,b)=>b.rating-a.rating).forEach(v=>{html+=`<li>${v.name} ${v.rating}★ €${(v.totalPrice/v.diners).toFixed(2)}</li>`;});html+='</ul>';});friendView.innerHTML=html;});