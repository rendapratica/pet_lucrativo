const Dashboard={
  iso(d){return d.toLocaleDateString('sv-SE')},
  meses(n,ref=new Date()){return Array.from({length:n},(_,k)=>{const i=n-1-k,a=new Date(ref.getFullYear(),ref.getMonth()-i,1),b=new Date(ref.getFullYear(),ref.getMonth()-i+1,0);return{rot:a.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}),de:this.iso(a),ate:this.iso(b)}})},
  csv(l){const e=v=>{v=v==null?'':String(v);return/[",;\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};return'\ufeff'+l.map(r=>r.map(e).join(';')).join('\n')},
  periodo(){const h=U.hoje();return`<div class="barra"><div style="flex:1"><label for="de">De</label><input id="de" type="date" value="${h.slice(0,8)}01"></div><div style="flex:1"><label for="ate">Até</label><input id="ate" type="date" value="${h}"></div></div>`},
  grafico(host,rot,series,fmt){
    if(window.Chart){Chart.defaults.color=getComputedStyle(document.documentElement).getPropertyValue('--texto').trim()||'#333';host.innerHTML='<canvas></canvas>';
      new Chart(host.firstChild,{type:'bar',data:{labels:rot,datasets:series.map(s=>({label:s.nome,data:s.dados,backgroundColor:s.cor}))},options:{responsive:true,plugins:{legend:{display:series.length>1}}}});return}
    const max=Math.max(1,...series.flatMap(s=>s.dados));
    host.innerHTML=(series.length>1?`<small>${series.map(s=>`<span style="color:${s.cor}">■</span> ${UI.h(s.nome)}`).join(' &nbsp; ')}</small>`:'')+(rot.length?rot.map((l,i)=>`<div class="linha"><span>${UI.h(l)}</span><div>${series.map(s=>`<div class="fill" style="width:${Math.max(1,s.dados[i]/max*100)}%;background:${s.cor}"></div>`).join('')}</div><span>${series.map(s=>fmt(s.dados[i])).join(' / ')}</span></div>`).join(''):'<p class="vazio">Sem dados no período.</p>');
  },
  async render(el){
    el.innerHTML=App.statusBackup()+Licenca.aviso()+this.periodo()+'<div id="painel"></div>';
    const de=el.querySelector('#de'),ate=el.querySelector('#ate'),p=el.querySelector('#painel'),R=U.R;
    const desenhar=async()=>{
      if(de.value>ate.value){App.toast('A data inicial não pode ser depois da final.',true);return}
      const[ag,pets,tu,at,ho,vac,prods,pk,sd]=await Promise.all([...['agendamentos','pets','tutores','atendimentos','hospedagens','vacinas','produtos','pacotesClientes'].map(s=>DB.todos(s)),Estoque.saldos()]),f=await Financeiro.resumo(de.value,ate.value),h=U.hoje();
      const np=Object.fromEntries(pets.map(x=>[x.id,x])),nt=Object.fromEntries(tu.map(t=>[t.id,t.nome])),hoje=ag.filter(a=>a.data===h&&Agenda.ATIVOS.includes(a.status)),
        prox=ag.filter(a=>Agenda.ATIVOS.includes(a.status)&&(a.data>h||(a.data===h&&a.hora>=new Date().toTimeString().slice(0,5)))).sort((a,b)=>(a.data+a.hora).localeCompare(b.data+b.hora))[0];
      const pend=Vacinas.pendencias(vac,h,30),venc=pend.filter(x=>x.situacao==='Vencida').length,baixo=prods.filter(x=>(sd[x.id]||0)<=(+x.minimo||0)),mes=h.slice(5,7);
      const aniv=pets.filter(x=>x.nascimento&&x.nascimento.slice(5,7)===mes).sort((a,b)=>a.nascimento.slice(8).localeCompare(b.nascimento.slice(8)));
      const per=at.filter(a=>a.data>=de.value&&a.data<=ate.value),cont={};per.forEach(a=>a.itens.forEach(i=>cont[i.nome]=(cont[i.nome]||0)+1));const top=Object.entries(cont).sort((a,b)=>b[1]-a[1]).slice(0,6);
      const M=(t,v,i)=>i?`<div class="card metrica ico"><div class="mi">${Ico(i,46)}</div><div class="mt"><small>${t}</small><div class="total-os">${v}</div></div></div>`:`<div class="card metrica"><small>${t}</small><div class="total-os">${v}</div></div>`;
      const pv=pk.filter(x=>x.sessoesUsadas<x.sessoesTotal&&x.validade<h).length;
      p.innerHTML=`<div class="grade">${M('Atendimentos hoje',hoje.length,'paw')}${M('Próximo horário',prox?`${prox.hora}${prox.data!==h?' ('+U.data(prox.data).slice(0,5)+')':''} · ${UI.h((np[prox.petId]||{}).nome||'')}`:'—','clock')}${M('Hospedados agora',ho.filter(x=>x.status==='Hospedado').length,'bed')}
        ${M('Pacotes de banho vencidos',pv,'bath')}${M('Vacinas a vencer (30 dias)',pend.length,'syringe')}${M('Produtos com estoque baixo',baixo.length,'box')}
        ${M('Receita no período',R(f.receita),'cart')}${M('Despesas pagas',R(f.despesas),'wallet')}${M('Lucro estimado',R(f.lucro),'trend')}
        </div>
        <div class="grade" style="margin-top:16px">${M('Ticket médio (banho e tosa)',R(f.qtd?f.atend/f.qtd:0))}${M('Pets cadastrados',pets.length)}${M('Vacinas vencidas',venc)}</div>
        <div class="card" style="margin-top:16px"><h2>Receita x despesas — últimos 6 meses</h2><div class="graf" id="g1"></div></div>
        <div class="card"><h2>Serviços mais realizados no período</h2><div class="graf" id="g2"></div></div>
        <div class="card"><h2>Lembretes de vacina</h2>${UI.tabela(['Pet','Vacina','Próxima dose','Situação'],pend.slice(0,6).map(x=>[UI.h((np[x.petId]||{}).nome||'—')+`<br><small>${UI.h(nt[(np[x.petId]||{}).tutorId]||'')}</small>`,UI.h(x.tipo),U.data(x.proximaDose),`<span class="${x.situacao==='Vencida'?'atraso':''}">${x.situacao}</span>`]),'Tudo em dia!')}<p><a href="#vacinas">Ver todos os lembretes</a></p></div>
        <div class="card"><h2>Aniversário dos pets neste mês</h2>${aniv.length?aniv.map(x=>`<span class="pill">${U.data(x.nascimento).slice(0,5)} · ${UI.h(x.nome)}</span> `).join(''):'<p class="vazio">Nenhum aniversariante neste mês.</p>'}</div>
        <div class="card"><h2>Estoque baixo</h2>${baixo.length?baixo.slice(0,8).map(x=>`<span class="pill">${UI.h(x.nome)}: ${sd[x.id]||0}</span> `).join(''):'<p class="vazio">Nenhum produto abaixo do mínimo.</p>'}</div>`;
      const ms=this.meses(6),rs=[];for(const m of ms)rs.push(await Financeiro.resumo(m.de,m.ate));
      this.grafico(p.querySelector('#g1'),ms.map(m=>m.rot),[{nome:'Receita',dados:rs.map(r=>r.receita),cor:'#16a34a'},{nome:'Despesas',dados:rs.map(r=>r.despesas),cor:'#6b7280'}],R);
      this.grafico(p.querySelector('#g2'),top.map(t=>t[0]),[{nome:'Vezes',dados:top.map(t=>t[1]),cor:'#16a34a'}],v=>v);
    };
    de.onchange=ate.onchange=desenhar;desenhar();
  },
  async relatorios(el){
    el.innerHTML=this.periodo()+'<div id="rel"></div>';
    const de=el.querySelector('#de'),ate=el.querySelector('#ate'),box=el.querySelector('#rel'),R=U.R;
    const desenhar=async()=>{
      const L=await Pacotes.rotuloPet(),[at,ve,ho]=await Promise.all(['atendimentos','vendas','hospedagens'].map(s=>DB.todos(s))),no=d=>d>=de.value&&d<=ate.value,f=await Financeiro.resumo(de.value,ate.value);
      const ls=at.filter(a=>no(a.data)).sort((a,b)=>a.data.localeCompare(b.data)),vs=ve.filter(v=>no(v.data)),hs=ho.filter(x=>x.status==='Finalizado'&&no(x.saidaReal)),formas={},prod={};
      ls.forEach(a=>{const k=a.total?a.forma:'Pacote';formas[k]=(formas[k]||0)+a.total});vs.forEach(v=>formas[v.forma]=(formas[v.forma]||0)+v.total);hs.forEach(x=>formas[x.forma]=(formas[x.forma]||0)+x.total);
      vs.forEach(v=>v.itens.forEach(i=>{const q=prod[i.nome]=prod[i.nome]||{n:0,v:0};q.n+=i.qtd;q.v+=i.qtd*i.preco}));
      const linhas=ls.map(a=>[U.data(a.data),L.nome[a.petId]||'',a.itens.map(i=>i.nome).join(' + '),a.forma,a.total]);
      box.innerHTML=`<div class="card"><h2>Receita por origem</h2>${UI.tabela(['Origem','Total'],[['Banho e tosa (atendimentos)',R(f.atend)],['Pacotes vendidos',R(f.pacotes)],['Hotel e creche',R(f.hotel)],['Loja',R(f.loja)],['Receitas avulsas',R(f.avulsas)]],'')}</div>
        <div class="card"><h2>Atendimentos do período</h2><div class="acoes" style="margin:0 0 10px"><button id="csv"${linhas.length?'':' disabled'}>Exportar CSV</button></div>${UI.tabela(['Data','Pet','Serviços','Total'],linhas.map(l=>[l[0],UI.h(l[1]),UI.h(l[2]),R(l[4])]),'Nenhum atendimento no período.')}</div>
        <div class="card"><h2>Produtos mais vendidos</h2>${UI.tabela(['Produto','Qtd','Receita'],Object.entries(prod).sort((a,b)=>b[1].n-a[1].n).map(([k,q])=>[UI.h(k),q.n,R(q.v)]),'Sem vendas no período.')}</div>
        <div class="card"><h2>Recebimentos por forma de pagamento</h2>${UI.tabela(['Forma','Total'],Object.entries(formas).map(([k,v])=>[UI.h(k),R(v)]),'Sem recebimentos.')}</div>`;
      const b=box.querySelector('#csv');if(b)b.onclick=()=>Backup.baixar(`atendimentos-${de.value}-a-${ate.value}.csv`,this.csv([['Data','Pet','Serviços','Forma','Total'],...linhas]),'text/csv;charset=utf-8');
    };
    de.onchange=ate.onchange=desenhar;desenhar();
  }
};
