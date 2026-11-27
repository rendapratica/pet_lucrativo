const Vendas={
  calcular(itens,desc){const bruto=itens.reduce((s,i)=>s+i.qtd*i.preco,0),d=Math.min(Math.max(0,+desc||0),bruto);return{bruto,desconto:d,total:Math.round((bruto-d)*100)/100,custo:itens.reduce((s,i)=>s+i.qtd*i.custo,0)}},
  async render(el){
    const h=U.hoje();
    el.innerHTML=`<div class="barra"><div style="flex:1"><label for="de">De</label><input id="de" type="date" value="${h.slice(0,8)}01"></div><div style="flex:1"><label for="ate">Até</label><input id="ate" type="date" value="${h}"></div><button id="novo" style="align-self:end">Nova venda</button></div><div id="lista"></div>`;
    const lista=el.querySelector('#lista'),de=el.querySelector('#de'),ate=el.querySelector('#ate');
    const desenhar=async()=>{const tu=Object.fromEntries((await DB.todos('tutores')).map(t=>[t.id,t.nome])),ls=(await DB.todos('vendas')).filter(v=>v.data>=de.value&&v.data<=ate.value).sort((a,b)=>b.data.localeCompare(a.data));
      lista.innerHTML=UI.tabela(['Data','Cliente','Itens','Total',''],ls.map(v=>[U.data(v.data),UI.h(tu[v.tutorId]||'Sem cadastro'),UI.h(v.itens.map(i=>i.qtd+'× '+i.nome).join(', ')),`<b>${U.R(v.total)}</b><br><small>${UI.h(v.forma)}</small>`,`<button class="peq risco" data-id="${v.id}">Excluir</button>`]),'Nenhuma venda no período.')};
    de.onchange=ate.onchange=desenhar;el.querySelector('#novo').onclick=()=>this.nova(desenhar);
    lista.onclick=async e=>{const b=e.target.closest('button');if(!b)return;const v=await DB.obter('vendas',b.dataset.id);if(!v||!await App.confirmar('Excluir esta venda? Os produtos voltam ao estoque.'))return;
      for(const i of v.itens)await Estoque.mover(i.produtoId,i.qtd,'entrada','Estorno de venda');await DB.remover('vendas',v.id);await DB.registrarHistorico('venda excluída',U.data(v.data));App.toast('Venda excluída.');desenhar()};
    desenhar();
  },
  async nova(depois){
    const[prods,tu,sd]=await Promise.all([DB.todos('produtos'),DB.todos('tutores'),Estoque.saldos()]);if(!prods.length){App.toast('Cadastre os produtos antes de vender.',true);return}
    UI.form('Nova venda',[{k:'tutorId',l:'Cliente (opcional)',t:'select',opts:[['','Sem cadastro'],...U.opts(tu.sort((a,b)=>U.ord(a.nome,b.nome)))]},{k:'data',l:'Data',type:'date',req:1},{k:'forma',l:'Forma de pagamento',t:'select',opts:Financeiro.formas()},{k:'desconto',l:'Desconto (R$)',type:'number'}],{data:U.hoje(),forma:'PIX',desconto:''},async r=>{
      const rows=[...document.querySelectorAll('#itens .peca')].map(d=>{const i=d.querySelectorAll('input'),nm=i[0].value.trim();return{nm,pr:prods.find(p=>UI.norm(p.nome)===UI.norm(nm)),qtd:+i[1].value,preco:+i[2].value}}).filter(x=>x.nm);
      if(!rows.length)throw new Error('Adicione ao menos um produto.');const sem=rows.find(x=>!x.pr);if(sem)throw new Error('Produto não cadastrado: '+sem.nm);
      if(rows.some(x=>!(x.qtd>0)||!(x.preco>=0)))throw new Error('Confira quantidades e preços.');
      const need={};rows.forEach(x=>need[x.pr.id]=(need[x.pr.id]||0)+x.qtd);for(const id of Object.keys(need))if(need[id]>(sd[id]||0))throw new Error(`Estoque insuficiente de "${prods.find(p=>p.id===id).nome}": disponível ${sd[id]||0}.`);
      const itens=rows.map(x=>({produtoId:x.pr.id,nome:x.pr.nome,qtd:x.qtd,preco:x.preco,custo:x.pr.custo||0})),c=this.calcular(itens,r.desconto);if(+r.desconto<0)throw new Error('O desconto não pode ser negativo.');
      const v=await DB.salvar('vendas',{tutorId:r.tutorId,data:r.data,forma:r.forma,itens,desconto:c.desconto,total:c.total,custo:c.custo});for(const i of itens)await Estoque.mover(i.produtoId,-i.qtd,'saída','Venda',{vendaId:v.id});
      await DB.registrarHistorico('venda',U.data(r.data)+' · '+U.R(c.total));App.toast('Venda registrada.');depois()},x=>{
      x.innerHTML=`<label>Produtos</label><div id="itens"></div><datalist id="dlP">${prods.map(p=>`<option value="${UI.h(p.nome)}">`).join('')}</datalist><button type="button" class="sec peq" id="addIt" style="margin-top:8px">+ Adicionar produto</button><div class="total-os" id="tot"></div>`;
      const calc=()=>{const it=[...x.querySelectorAll('.peca')].map(d=>{const i=d.querySelectorAll('input');return{qtd:+i[1].value||0,preco:+i[2].value||0,custo:0}});x.querySelector('#tot').textContent='Total: '+U.R(this.calcular(it,document.getElementById('f_desconto').value).total)};
      const linha=()=>{const d=document.createElement('div');d.className='peca';d.innerHTML=`<input placeholder="Produto" list="dlP"><input type="number" min="0" step="any" value="1" aria-label="Quantidade"><input type="number" min="0" step="0.01" value="0" aria-label="Preço"><button type="button" class="sec peq" aria-label="Remover">×</button>`;
        d.querySelector('button').onclick=()=>{d.remove();calc()};d.oninput=e=>{if(e.target===d.firstChild){const p=prods.find(q=>UI.norm(q.nome)===UI.norm(e.target.value));if(p)d.querySelectorAll('input')[2].value=p.preco}calc()};x.querySelector('#itens').appendChild(d)};
      x.querySelector('#addIt').onclick=()=>{linha();calc()};document.getElementById('f_desconto').oninput=calc;linha();calc()});
  }
};
