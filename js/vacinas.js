const Vacinas={
  TIPOS:['Antirrábica','V8 / V10 (polivalente)','V4 / V5 (gatos)','Gripe canina','Giárdia','Leishmaniose','Vermífugo','Antipulgas e carrapatos','Outra'],
  DIAS:{'Antirrábica':365,'V8 / V10 (polivalente)':365,'V4 / V5 (gatos)':365,'Gripe canina':365,'Giárdia':365,'Leishmaniose':365,'Vermífugo':90,'Antipulgas e carrapatos':30},
  pendencias(vacs,hoje,dias){const ult={};vacs.forEach(v=>{const k=v.petId+'|'+v.tipo;if(!ult[k]||v.data>ult[k].data)ult[k]=v});
    return Object.values(ult).filter(v=>v.proximaDose&&v.proximaDose<=U.add(hoje,dias||30)).map(v=>({...v,situacao:v.proximaDose<hoje?'Vencida':'A vencer'})).sort((a,b)=>a.proximaDose.localeCompare(b.proximaDose))},
  async render(el){
    el.innerHTML=`<div class="barra"><button id="novo">Registrar vacina ou vermífugo</button></div><h2 style="margin:6px 0 8px">Lembretes (vencidas e próximos 30 dias)</h2><div id="pend"></div><h2 style="margin:20px 0 8px">Todas as aplicações</h2><div id="todas"></div>`;
    const desenhar=async()=>{
      const L=await Pacotes.rotuloPet(),tu=Object.fromEntries((await DB.todos('tutores')).map(t=>[t.id,t])),pets=Object.fromEntries(L.pets.map(p=>[p.id,p])),vac=await DB.todos('vacinas'),h=U.hoje();
      el.querySelector('#pend').innerHTML=UI.tabela(['Pet','Vacina','Próxima dose','Situação',''],this.pendencias(vac,h,30).map(v=>{const p=pets[v.petId]||{},t=tu[p.tutorId]||{},w=U.wa(t.telefone,`Olá, ${t.nome||''}! A ${v.tipo} do ${p.nome||'pet'} ${v.situacao==='Vencida'?'está vencida desde':'vence em'} ${U.data(v.proximaDose)}. Vamos agendar?`);
        return[`<b>${UI.h(p.nome||'—')}</b><br><small>${UI.h(t.nome||'')}</small>`,UI.h(v.tipo),U.data(v.proximaDose),`<span class="${v.situacao==='Vencida'?'atraso':''}">${v.situacao}</span>`,`<div class="acoes"><button class="peq" data-a="ap" data-id="${v.id}">Registrar dose</button>${w?`<a target="_blank" rel="noopener" href="${w}" style="padding:5px 10px;border:1px solid var(--borda);border-radius:6px;font-size:13px;text-decoration:none;color:inherit">WhatsApp</a>`:''}</div>`]}),'Nenhuma vacina vencida ou para vencer. Tudo em dia!');
      el.querySelector('#todas').innerHTML=UI.tabela(['Pet','Vacina','Aplicada em','Próxima dose',''],vac.sort((a,b)=>b.data.localeCompare(a.data)).map(v=>[UI.h((pets[v.petId]||{}).nome||'—'),UI.h(v.tipo),U.data(v.data),v.proximaDose?U.data(v.proximaDose):'—',`<button class="peq risco" data-a="ex" data-id="${v.id}">Excluir</button>`]),'Nenhuma aplicação registrada.');
    };
    el.onclick=async e=>{const b=e.target.closest('button[data-a]');if(!b)return;const v=await DB.obter('vacinas',b.dataset.id);if(!v)return;
      if(b.dataset.a==='ap')this.registrar({petId:v.petId,tipo:v.tipo},desenhar);
      if(b.dataset.a==='ex'&&await App.confirmar('Excluir este registro?')){await DB.remover('vacinas',v.id);App.toast('Excluído.');desenhar()}};
    el.querySelector('#novo').onclick=()=>this.registrar({},desenhar);desenhar();
  },
  async registrar(pre,depois){
    const L=await Pacotes.rotuloPet();if(!L.pets.length){App.toast('Cadastre um pet antes.',true);return}
    UI.form('Registrar aplicação',[{k:'petId',l:'Pet',t:'select',req:1,opts:L.opts,wide:1},{k:'tipo',l:'Vacina / vermífugo',req:1,list:this.TIPOS},{k:'data',l:'Aplicada em',type:'date',req:1},{k:'proximaDose',l:'Próxima dose',type:'date'},{k:'obs',l:'Observações (lote, veterinário)',wide:1}],{petId:L.pets[0].id,data:U.hoje(),tipo:'',...pre},async r=>{
      if(r.proximaDose&&r.proximaDose<=r.data)throw new Error('A próxima dose deve ser depois da aplicação.');await DB.salvar('vacinas',r);await DB.registrarHistorico('vacina',r.tipo);App.toast('Aplicação registrada.');depois()},()=>{
      const t=document.getElementById('f_tipo'),d=document.getElementById('f_data'),p=document.getElementById('f_proximaDose');let manual=false;
      const auto=()=>{if(!manual&&this.DIAS[t.value]&&d.value)p.value=U.add(d.value,this.DIAS[t.value])};p.oninput=()=>{manual=true};t.oninput=auto;t.onchange=auto;d.onchange=auto;if(pre.tipo&&!p.value)auto()});
  }
};
