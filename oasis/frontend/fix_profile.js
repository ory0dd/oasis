const content = JSON.stringify({avatar:'https://firebasestorage.googleapis.com/v0/b/oasiis-d43e3.firebasestorage.app/o/5188d078-0192-4c47-ae58-98a88245bd5b.jpg?alt=media&token=c1887943-60f6-471c-83de-0e874b36f865',coverImage:'https://firebasestorage.googleapis.com/v0/b/oasiis-d43e3.firebasestorage.app/o/ce278438-df50-4a3c-a101-70aecfe57465.jpg?alt=media&token=b7198602-cdac-47fc-a9c5-198ce3924e9d',fullName:'fbdcb@hotmail.com',bio:'Progreso: 0/1',profileLink:''});
fetch('http://localhost:5046/api/oasis/blocks?user=XIDehIx')
  .then(r=>r.json())
  .then(blocks=>{
    blocks.push({
      id: 'profile_settings',
      type: 'profile_settings',
      content: content,
      isPublic: false,
      timestamp: new Date().toISOString()
    });
    return fetch('http://localhost:5046/api/oasis/blocks?user=XIDehIx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Oasis-User': 'XIDehIx' },
      body: JSON.stringify(blocks)
    });
  })
  .then(r=>console.log('STATUS:', r.status));
