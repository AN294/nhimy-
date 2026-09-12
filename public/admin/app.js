const status=document.querySelector('#status'),metrics=document.querySelector('#metrics'),users=document.querySelector('#users'),refresh=document.querySelector('#refresh');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const metric=(label,value,detail='')=>`<article class="admin-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong>${detail?`<small>${esc(detail)}</small>`:''}</article>`;
function renderOverview(o){
  const cards=[
    metric('Utilizadores',o.users),metric('Sessões ativas',o.activeSessions),metric('Contas com dados',o.accountsWithData),metric('Administradores',o.admins),
    metric('Estudar — sessões',o.study.accounts),metric('Estudar — praticaram',o.study.practiced),metric('Estudar — mediram',o.study.measured),
    metric('Trabalhos — ativos',o.work.accounts),metric('Trabalhos — pesquisados',o.work.researched),metric('Trabalhos — revisados',o.work.reviewed),metric('Trabalhos — finalizados',o.work.finalized),
    metric('Tarefas',o.organize.tasks,`${o.organize.completedTasks} concluídas`),metric('Metas',o.organize.goals),metric('Notas',o.organize.notes),metric('Agenda',o.organize.events),metric('Biblioteca',o.library.items)
  ];
  metrics.innerHTML=cards.join('');
}
async function load(){status.textContent='A carregar…';try{const [a,b,m]=await Promise.all([fetch('/api/admin/overview'),fetch('/api/admin/users'),fetch('/api/admin/monetization')]);const overview=await a.json(), list=await b.json(), monetization=await m.json();if(!a.ok||!b.ok||!m.ok)throw new Error(overview.error||list.error||'Acesso recusado.');status.textContent='✓ Acesso administrativo autorizado.';renderOverview(overview.overview);
    const existing=document.querySelector('.admin-monetization');
    if(existing && monetization.monetization){ existing.innerHTML=`<strong>Estado: ${esc(monetization.monetization.status === 'active' ? 'ativo' : 'preparado, não ativado')}</strong><span>Fornecedor: ${esc(monetization.monetization.provider || 'não configurado')} · Identificador: ${monetization.monetization.publisherConfigured ? 'configurado' : 'não configurado'} · Consentimento obrigatório.</span>`; }
    users.innerHTML=list.users.map(u=>`<article class="admin-user"><div><strong>${esc(u.name||'Sem nome')}</strong><span>${esc(u.email)}</span></div><span class="admin-role">${esc(u.role)}</span></article>`).join('')||'<p>Nenhum utilizador.</p>';}catch(e){status.textContent='⚠ '+e.message;metrics.innerHTML='';users.innerHTML='';}}
refresh.addEventListener('click',load);load();
