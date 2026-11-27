const Tutores={render(el){Crud.tela(el,{store:'tutores',novo:'Novo tutor',vazio:'Nenhum tutor cadastrado ainda.',colunas:['Tutor','WhatsApp','Pets'],busca:r=>r.nome+' '+(r.telefone||''),
  ctx:async()=>{const n={};(await DB.todos('pets')).forEach(p=>n[p.tutorId]=(n[p.tutorId]||[]).concat(p.nome));return{n}},
  linha:(r,c)=>[`<b>${UI.h(r.nome)}</b>${r.endereco?'<br><small>'+UI.h(r.endereco)+'</small>':''}`,UI.h(r.telefone),UI.h((c.n[r.id]||[]).join(', '))||'—'],acoes:[['pet','+ Pet']],acao:(a,r,d)=>Pets.editar({tutorId:r.id},d),
  campos:[{k:'nome',l:'Nome do tutor',req:1,wide:1},{k:'telefone',l:'WhatsApp / telefone'},{k:'endereco',l:'Endereço (para táxi dog e entregas)'},{k:'obs',l:'Observações',t:'textarea',wide:1}],
  salvar:async v=>{const d=v.telefone.replace(/\D/g,'');if(v.telefone&&(d.length<10||d.length>13))throw new Error('Telefone inválido: informe com DDD.');return{nome:v.nome,telefone:v.telefone,endereco:v.endereco,obs:v.obs}},
  bloqueio:async r=>(await DB.todos('pets')).some(p=>p.tutorId===r.id)?'Este tutor tem pets cadastrados. Exclua os pets antes.':''})}};
const Pets={
  cfg:{store:'pets',novo:'Novo pet',vazio:'Nenhum pet cadastrado. Cadastre o tutor primeiro e depois o pet.',colunas:['Pet','Tutor','Porte','Idade'],busca:r=>r.nome+' '+(r.raca||''),
    ctx:async()=>({t:Object.fromEntries((await DB.todos('tutores')).map(x=>[x.id,x.nome]))}),
    linha:(r,c)=>[`<b>${UI.h(r.nome)}</b><br><small>${UI.h(r.especie)}${r.raca?' · '+UI.h(r.raca):''}</small>${r.obs?'<br><small class="atraso">⚠ '+UI.h(r.obs)+'</small>':''}`,UI.h(c.t[r.tutorId]||'—'),r.porte,U.idade(r.nascimento)||'—'],
    acoes:[['ag','Agendar'],['fi','Ficha']],acao:(a,r)=>a==='ag'?Agenda.editar({petId:r.id},()=>{location.hash='agenda'}):Pets.ficha(r),
    campos:async()=>[{k:'tutorId',l:'Tutor',t:'select',req:1,opts:U.opts((await DB.todos('tutores')).sort((a,b)=>U.ord(a.nome,b.nome)))},{k:'nome',l:'Nome do pet',req:1},{k:'especie',l:'Espécie',t:'select',opts:[['Cão','Cão'],['Gato','Gato'],['Outro','Outro']]},{k:'raca',l:'Raça'},
      {k:'porte',l:'Porte',t:'select',opts:[['Pequeno','Pequeno'],['Médio','Médio'],['Grande','Grande']]},{k:'nascimento',l:'Nascimento',type:'date'},{k:'peso',l:'Peso (kg)',type:'number'},{k:'obs',l:'Alergias, medos e cuidados',t:'textarea',wide:1}],
    padrao:{especie:'Cão',porte:'Pequeno'},
    salvar:async v=>{if(!v.tutorId)throw new Error('Cadastre um tutor antes de cadastrar o pet.');if(v.nascimento&&v.nascimento>U.hoje())throw new Error('O nascimento não pode estar no futuro.');if(v.peso&&!(+v.peso>0&&+v.peso<150))throw new Error('Peso inválido.');
      return{tutorId:v.tutorId,nome:v.nome,especie:v.especie,raca:v.raca,porte:v.porte,nascimento:v.nascimento,peso:v.peso?+v.peso:'',obs:v.obs}},
    bloqueio:async r=>{for(const s of['atendimentos','agendamentos','vacinas','hospedagens','pacotesClientes'])if((await DB.todos(s)).some(x=>x.petId===r.id))return'Este pet tem agenda, atendimentos, vacinas, hospedagens ou pacotes. Exclua-os antes.';return''}},
  render(el){Crud.tela(el,this.cfg)},editar(p,depois){Crud.editar(this.cfg,p,depois)},
  async ficha(p){
    const t=await DB.obter('tutores',p.tutorId)||{},at=(await DB.todos('atendimentos')).filter(a=>a.petId===p.id).sort((a,b)=>b.data.localeCompare(a.data)),vac=(await DB.todos('vacinas')).filter(v=>v.petId===p.id).sort((a,b)=>b.data.localeCompare(a.data)),pk=await Pacotes.ativosDoPet(p.id);
    const linhas=[];for(const a of at){const fs=[];for(const id of a.fotos||[]){const i=await DB.obter('imagens',id);if(i)fs.push(i.data)}
      linhas.push([U.data(a.data),UI.h(a.itens.map(i=>i.nome).join(', ')),U.R(a.total)+(a.obs?`<br><small>${UI.h(a.obs)}</small>`:'')+(fs.length?`<div class="fotos">${fs.map(s=>`<img src="${s}" alt="Foto">`).join('')}</div>`:'')])}
    const w=U.wa(t.telefone,`Olá, ${t.nome||''}! Aqui é do pet shop, sobre o ${p.nome}.`);
    UI.info('Ficha — '+p.nome,`<p>${UI.h(p.especie)}${p.raca?' · '+UI.h(p.raca):''} · porte ${p.porte}${p.nascimento?' · '+U.idade(p.nascimento):''}${p.peso?' · '+p.peso+' kg':''}<br>Tutor: <b>${UI.h(t.nome||'—')}</b> ${UI.h(t.telefone)} ${w?`<a href="${w}" target="_blank" rel="noopener">WhatsApp</a>`:''}</p>${p.obs?`<div class="aviso"><b>Cuidados:</b> ${UI.h(p.obs)}</div>`:''}
      ${pk.length?`<p>Pacotes ativos: ${pk.map(x=>UI.h(x.nome)+' ('+(x.sessoesTotal-x.sessoesUsadas)+' restantes)').join('; ')}</p>`:''}
      <h3>Carteira de vacinas</h3>${UI.tabela(['Aplicação','Vacina','Próxima dose'],vac.map(v=>[U.data(v.data),UI.h(v.tipo),v.proximaDose?U.data(v.proximaDose):'—']),'Nenhuma vacina registrada.')}
      <h3>Atendimentos</h3>${UI.tabela(['Data','Serviços','Valor / fotos'],linhas,'Nenhum atendimento ainda.')}`);
  }
};
