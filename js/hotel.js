const Hotel={
  STATUS:['Reservado','Hospedado','Finalizado','Cancelado'],ABERTOS:['Reservado','Hospedado'],
  dias(tipo,e,s){const d=Math.round((new Date(s+'T12:00')-new Date(e+'T12:00'))/864e5);return tipo==='Creche'?d+1:Math.max(1,d)},
  total({tipo,entrada,saida,diaria,extras,desconto}){return Math.max(0,Math.round((this.dias(tipo,entrada,saida)*diaria+(+extras||0)-(+desconto||0))*100)/100)},
  async render(el){
    el.innerHTML=`<div id="cards" class="grade"></div><div class="barra" style="margin-top:14px"><select id="fil"><option value="a">Em andamento</option><option value="">Todos</option></select><button id="novo">Nova reserva</button></div><div id="lista"></div>`;
    const lista=el.querySelector('#lista'),fil=el.querySelector('#fil');
    const desenhar=async()=>{
      const L=await Pacotes.rotuloPet(),h=U.hoje(),todos=await DB.todos('hospedagens'),ls=todos.filter(x=>!fil.value||this.ABERTOS.includes(x.status)).sort((a,b)=>a.entrada.localeCompare(b.entrada));
      const M=(t,v)=>`<div class="card metrica"><small>${t}</small><div class="total-os">${v}</div></div>`;
      el.querySelector('#cards').innerHTML=M('Hospedados agora',todos.filter(x=>x.status==='Hospedado').length)+M('Entradas hoje',todos.filter(x=>x.status==='Reservado'&&x.entrada===h).length)+M('Saídas previstas hoje',todos.filter(x=>x.status==='Hospedado'&&x.saidaPrevista===h).length);
      lista.innerHTML=UI.tabela(['Pet','Tipo','Entrada','Saída','Status','Valor',''],ls.map(x=>[UI.h(L.nome[x.petId]||'—'),x.tipo,U.data(x.entrada),U.data(x.saidaReal||x.saidaPrevista),
        `<select data-st data-id="${x.id}" aria-label="Status"${x.status==='Finalizado'?' disabled':''}>${this.STATUS.map(s=>`<option${s===x.status?' selected':''}>${s}</option>`).join('')}</select>`,
        x.status==='Finalizado'?`<b>${U.R(x.total)}</b>`:U.R(x.diaria)+'/dia',`<div class="acoes">${x.status==='Finalizado'?'':`<button class="sec peq" data-a="ed" data-id="${x.id}">Editar</button>`}<button class="peq risco" data-a="ex" data-id="${x.id}">Excluir</button></div>`]),'Nenhuma reserva neste filtro.');
    };
    fil.onchange=desenhar;el.querySelector('#novo').onclick=()=>this.editar({},desenhar);
    lista.onchange=async e=>{if(!e.target.dataset.st)return;const x=await DB.obter('hospedagens',e.target.dataset.id);
      if(e.target.value==='Finalizado'){desenhar();this.checkout(x,desenhar);return}x.status=e.target.value;await DB.salvar('hospedagens',x);App.toast('Status atualizado.');desenhar()};
    lista.onclick=async e=>{const b=e.target.closest('button');if(!b)return;const x=await DB.obter('hospedagens',b.dataset.id);if(!x)return;
      if(b.dataset.a==='ed')this.editar(x,desenhar);if(b.dataset.a==='ex'&&await App.confirmar('Excluir esta reserva?')){await DB.remover('hospedagens',x.id);App.toast('Reserva excluída.');desenhar()}};
    desenhar();
  },
  async editar(x,depois){
    const L=await Pacotes.rotuloPet();if(!L.pets.length){App.toast('Cadastre um pet antes.',true);return}const cfg=(await DB.obter('configuracoes','hotel'))||{id:'hotel',Hotel:80,Creche:50};
    UI.form(x.id?'Editar reserva':'Nova reserva',[{k:'petId',l:'Pet',t:'select',req:1,opts:L.opts,wide:1},{k:'tipo',l:'Tipo',t:'select',opts:[['Hotel','Hotel (pernoite)'],['Creche','Creche (day care)']]},{k:'diaria',l:'Diária (R$)',type:'number',req:1},{k:'entrada',l:'Entrada',type:'date',req:1},{k:'saidaPrevista',l:'Saída prevista',type:'date',req:1},{k:'obs',l:'Observações (ração, medicação, pertences)',t:'textarea',wide:1}],
      {petId:L.pets[0].id,tipo:'Hotel',entrada:U.hoje(),saidaPrevista:U.add(U.hoje(),1),status:'Reservado',diaria:'',...x},async r=>{
      if(r.saidaPrevista<r.entrada)throw new Error('A saída não pode ser antes da entrada.');if(!(+r.diaria>0))throw new Error('Informe o valor da diária.');
      await DB.salvar('hospedagens',{status:'Reservado',...x,...r,diaria:+r.diaria});cfg[r.tipo]=+r.diaria;await DB.salvar('configuracoes',cfg);App.toast('Reserva salva.');depois()},()=>{
      const t=document.getElementById('f_tipo'),d=document.getElementById('f_diaria');if(!d.value)d.value=cfg[t.value]||'';t.onchange=()=>{d.value=cfg[t.value]||''}});
  },
  checkout(x,depois){
    const calc=()=>{const g=i=>document.getElementById(i).value;document.getElementById('tt').textContent='Total: '+U.R(this.total({tipo:x.tipo,entrada:x.entrada,saida:g('f_saidaReal')||x.saidaPrevista,diaria:x.diaria,extras:g('f_extras'),desconto:g('f_desconto')}))+` (${this.dias(x.tipo,x.entrada,g('f_saidaReal')||x.saidaPrevista)} dia(s) × ${U.R(x.diaria)})`};
    UI.form('Check-out',[{k:'saidaReal',l:'Data de saída',type:'date',req:1},{k:'extras',l:'Extras (banho, ração, medicação) R$',type:'number'},{k:'desconto',l:'Desconto (R$)',type:'number'},{k:'forma',l:'Forma de pagamento',t:'select',opts:Financeiro.formas()}],{saidaReal:U.hoje(),forma:'PIX'},async r=>{
      if(r.saidaReal<x.entrada)throw new Error('A saída não pode ser antes da entrada.');const t=this.total({tipo:x.tipo,entrada:x.entrada,saida:r.saidaReal,diaria:x.diaria,extras:r.extras,desconto:r.desconto});
      if(+r.extras<0||+r.desconto<0)throw new Error('Valores não podem ser negativos.');
      await DB.salvar('hospedagens',{...x,status:'Finalizado',saidaReal:r.saidaReal,extras:+r.extras||0,desconto:+r.desconto||0,forma:r.forma,total:t});await DB.registrarHistorico('check-out',U.R(t));App.toast('Check-out feito. Valor: '+U.R(t));depois()},e=>{
      e.innerHTML='<div class="total-os" id="tt"></div>';['f_saidaReal','f_extras','f_desconto'].forEach(i=>document.getElementById(i).oninput=calc);calc()});
  }
};
