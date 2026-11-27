const Estoque={
  async saldos(){const s={};(await DB.todos('movimentos')).forEach(m=>s[m.produtoId]=(s[m.produtoId]||0)+m.delta);return s},
  mover(produtoId,delta,tipo,motivo,extra){return DB.salvar('movimentos',{produtoId,delta,tipo,motivo,data:new Date().toISOString(),...extra})},
  render(el){Crud.tela(el,{store:'produtos',novo:'Novo produto',vazio:'Nenhum produto cadastrado. Ex.: ração, shampoo, coleira, petisco.',colunas:['Produto','Estoque','Custo','Venda'],busca:r=>r.nome+' '+(r.categoria||''),ctx:async()=>({s:await this.saldos()}),
    linha:(r,c)=>{const sd=c.s[r.id]||0,b=sd<=(+r.minimo||0);return[`<b>${UI.h(r.nome)}</b><br><small>${UI.h(r.categoria)}</small>`,`<span class="${b?'atraso':''}">${sd} ${UI.h(r.unidade||'un')}${b?' (baixo)':''}</span>`,U.R(r.custo),U.R(r.preco)]},
    acoes:[['entrada','Entrada'],['saída','Saída'],['ajuste','Ajuste'],['hi','Histórico']],acao:(a,r,d)=>a==='hi'?this.historico(r):this.movimento(r,a,d),
    campos:[{k:'nome',l:'Produto',req:1,wide:1},{k:'categoria',l:'Categoria',list:['Ração','Higiene','Acessórios','Brinquedos','Petiscos','Medicamentos','Outros']},{k:'unidade',l:'Unidade',list:['un','kg','pct','L']},{k:'minimo',l:'Estoque mínimo',type:'number'},{k:'custo',l:'Custo (R$)',type:'number'},{k:'preco',l:'Preço de venda (R$)',type:'number',req:1}],padrao:{unidade:'un'},
    salvar:async(v,r)=>{if((await DB.todos('produtos')).some(x=>x.id!==r.id&&UI.norm(x.nome)===UI.norm(v.nome)))throw new Error('Já existe um produto com este nome.');if(!(+v.preco>=0)||!(+v.custo>=0||v.custo===''))throw new Error('Confira custo e preço.');return{nome:v.nome,categoria:v.categoria,unidade:v.unidade,minimo:+v.minimo||0,custo:+v.custo||0,preco:+v.preco}},
    bloqueio:async r=>(await DB.todos('vendas')).some(v=>v.itens.some(i=>i.produtoId===r.id))?'Este produto já foi vendido e não pode ser excluído.':'',aoExcluir:async r=>{for(const m of(await DB.todos('movimentos')).filter(m=>m.produtoId===r.id))await DB.remover('movimentos',m.id)}})},
  async movimento(p,tipo,depois){
    const sd=(await this.saldos())[p.id]||0,T={entrada:'Entrada','saída':'Saída (perda ou uso)',ajuste:'Ajuste (contagem)'}[tipo];
    const campos=[{k:'qtd',l:tipo==='ajuste'?'Saldo contado':'Quantidade',type:'number',req:1,wide:tipo!=='entrada'}];if(tipo==='entrada')campos.push({k:'custo',l:'Custo unitário (R$)',type:'number'},{k:'despesa',l:'Lançar como despesa?',t:'select',opts:[['','Não'],['1','Sim']]});campos.push({k:'obs',l:'Observação',wide:1});
    UI.form(`${T} — ${p.nome} (saldo ${sd})`,campos,{custo:p.custo||''},async r=>{
      const q=+r.qtd;let d=q;if(tipo==='ajuste')d=q-sd;else if(!(q>0))throw new Error('Informe uma quantidade maior que zero.');
      if(tipo==='saída'){if(q>sd)throw new Error('Saída maior que o saldo.');d=-q}if(tipo==='ajuste'&&d===0)throw new Error('O saldo contado é igual ao atual.');
      await this.mover(p.id,d,tipo,r.obs||T);
      if(tipo==='entrada'&&+r.custo>0){p.custo=+r.custo;await DB.salvar('produtos',p);if(r.despesa==='1')await DB.salvar('despesas',{descricao:'Compra: '+p.nome,categoria:'Produtos para revenda',valor:q*(+r.custo),vencimento:U.hoje(),pago:true,dataPagamento:U.hoje(),forma:''})}
      App.toast('Movimento registrado.');depois()});
  },
  async historico(p){const m=(await DB.todos('movimentos')).filter(x=>x.produtoId===p.id).sort((a,b)=>b.data.localeCompare(a.data));
    UI.info('Histórico — '+p.nome,UI.tabela(['Data','Tipo','Qtd','Motivo'],m.map(x=>[new Date(x.data).toLocaleString('pt-BR'),x.tipo,(x.delta>0?'+':'')+x.delta,UI.h(x.motivo)]),'Sem movimentos.'))}
};
