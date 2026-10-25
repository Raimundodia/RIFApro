'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Plus, Ticket, Users, Trophy, DollarSign, CheckCircle, 
  Trash2, Send, Shuffle, Sparkles, Share2, Flame, Upload
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Home() {
  const [aba, setAba] = useState('rifas');
  const [rifas, setRifas] = useState([]);
  const [rifaSelecionada, setRifaSelecionada] = useState(null);
  const [bilhetes, setBilhetes] = useState([]);
  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [novaRifa, setNovaRifa] = useState({ titulo: '', descricao: '', preco_cota: '', total_cotas: 100, imagem_url: '' });
  const [novoAfiliado, setNovoAfiliado] = useState({ nome: '', codigo: '', comissao_porcentagem: 10, pix_chave: '' });
  const [cotasSelecionadas, setCotasSelecionadas] = useState([]);
  const [comprador, setComprador] = useState({ nome: '', whatsapp: '', afiliado: '' });
  const [numFederal, setNumFederal] = useState('');
  const [ganhadorFederal, setGanhadorFederal] = useState(null);
  const [ganhadorRoleta, setGanhadorRoleta] = useState(null);
  const [roletando, setRoletando] = useState(false);

  useEffect(() => { carregarRifas(); carregarAfiliados(); }, []);
  useEffect(() => { if (rifaSelecionada) carregarBilhetes(rifaSelecionada.id); }, [rifaSelecionada]);

  const carregarRifas = async () => {
    setLoading(true);
    const { data } = await supabase.from('rifas').select('*').order('created_at', { ascending: false });
    if (data) { setRifas(data); if (data.length > 0 && !rifaSelecionada) setRifaSelecionada(data[0]); }
    setLoading(false);
  };

  const carregarAfiliados = async () => {
    const { data } = await supabase.from('afiliados').select('*');
    if (data) setAfiliados(data);
  };

  const carregarBilhetes = async (rifaId) => {
    const { data } = await supabase.from('bilhetes').select('*').eq('rifa_id', rifaId);
    if (data) setBilhetes(data);
  };

  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
      const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('rifas').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('rifas').getPublicUrl(fileName);
      setNovaRifa({ ...novaRifa, imagem_url: data.publicUrl });
      alert('Foto enviada!');
    } catch (err) { alert('Erro: ' + err.message); } finally { setUploading(false); }
  };

  const criarRifa = async (e) => {
    e.preventDefault();
    if (!novaRifa.titulo || !novaRifa.preco_cota) return alert('Preencha os obrigatórios!');
    setLoading(true);
    const { data, error } = await supabase.from('rifas').insert([{
      titulo: novaRifa.titulo, descricao: novaRifa.descricao,
      preco_cota: parseFloat(novaRifa.preco_cota), total_cotas: parseInt(novaRifa.total_cotas),
      imagem_url: novaRifa.imagem_url || 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800'
    }]).select();
    if (error) alert('Erro: ' + error.message);
    else {
      alert('Rifa criada!');
      setNovaRifa({ titulo: '', descricao: '', preco_cota: '', total_cotas: 100, imagem_url: '' });
      carregarRifas();
      if (data?.[0]) setRifaSelecionada(data[0]);
      setAba('rifas');
    }
    setLoading(false);
  };

  const deletarRifa = async (id) => {
    if (!confirm('Apagar rifa?')) return;
    const { error } = await supabase.from('rifas').delete().eq('id', id);
    if (error) alert('Erro: ' + error.message);
    else { setRifaSelecionada(null); carregarRifas(); }
  };

  const criarAfiliado = async (e) => {
    e.preventDefault();
    if (!novoAfiliado.nome || !novoAfiliado.codigo) return alert('Preencha nome e código!');
    const { error } = await supabase.from('afiliados').insert([{
      nome: novoAfiliado.nome, codigo: novoAfiliado.codigo.toLowerCase().trim(),
      comissao_porcentagem: parseFloat(novoAfiliado.comissao_porcentagem), pix_chave: novoAfiliado.pix_chave
    }]);
    if (error) alert('Erro: ' + error.message);
    else { alert('Afiliado cadastrado!'); setNovoAfiliado({ nome: '', codigo: '', comissao_porcentagem: 10, pix_chave: '' }); carregarAfiliados(); }
  };

  const selecionarCota = (num) => {
    if (cotasSelecionadas.includes(num)) setCotasSelecionadas(cotasSelecionadas.filter(n => n !== num));
    else {
      if (cotasSelecionadas.length >= 20) return alert('Máximo 20 cotas.');
      setCotasSelecionadas([...cotasSelecionadas, num]);
    }
  };

  const adicionarLote = (qtd) => {
    if (!rifaSelecionada) return;
    const livres = [];
    for (let i = 0; i < rifaSelecionada.total_cotas; i++) {
      if (!bilhetes.some(b => b.numero === i)) livres.push(i);
    }
    setCotasSelecionadas(livres.slice(0, qtd));
  };

  const realizarReserva = async (e) => {
    e.preventDefault();
    if (!cotasSelecionadas.length || !comprador.nome || !comprador.whatsapp) return alert('Preencha todos os campos!');
    setLoading(true);
    const registros = cotasSelecionadas.map(num => ({
      rifa_id: rifaSelecionada.id, numero: num, status: 'reservado',
      comprador_nome: comprador.nome, comprador_whatsapp: comprador.whatsapp, afiliado_codigo: comprador.afiliado || null
    }));
    const { error } = await supabase.from('bilhetes').insert(registros);
    if (error) alert('Erro: ' + error.message);
    else {
      alert('Cotas reservadas!');
      setCotasSelecionadas([]);
      setComprador({ nome: '', whatsapp: '', afiliado: '' });
      carregarBilhetes(rifaSelecionada.id);
    }
    setLoading(false);
  };

  const atualizarStatusCota = async (id, status) => {
    const { error } = await supabase.from('bilhetes').update({ status }).eq('id', id);
    if (!error && rifaSelecionada) carregarBilhetes(rifaSelecionada.id);
  };

  const enviarWhatsApp = (b) => {
    const texto = `Olá *${b.comprador_nome}*! Bilhete *#${b.numero.toString().padStart(3, '0')}* na rifa *${rifaSelecionada.titulo}* status: *${b.status}*.`;
    window.open(`https://wa.me/55${b.comprador_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const calcularFederal = () => {
    if (!numFederal || !rifaSelecionada) return;
    const numGanhador = parseInt(numFederal) % rifaSelecionada.total_cotas;
    const bGanhador = bilhetes.find(b => b.numero === numGanhador && b.status === 'pago');
    setGanhadorFederal({ numero: numGanhador, comprador: bGanhador ? bGanhador.comprador_nome : 'Não pago/livre', whatsapp: bGanhador?.comprador_whatsapp || '-' });
    confetti();
  };

  const rodarRoleta = () => {
    const pagos = bilhetes.filter(b => b.status === 'pago');
    if (!pagos.length) return alert('Nenhum pago!');
    setRoletando(true);
    let c = 0;
    const int = setInterval(() => {
      setGanhadorRoleta(pagos[Math.floor(Math.random() * pagos.length)]);
      c++;
      if (c > 20) { clearInterval(int); setRoletando(false); confetti(); }
    }, 80);
  };

  const totalPagos = bilhetes.filter(b => b.status === 'pago').length;
  const totalReservados = bilhetes.filter(b => b.status === 'reservado').length;
  const progresso = rifaSelecionada ? Math.round(((totalPagos + totalReservados) / rifaSelecionada.total_cotas) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
      <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setAba('rifas')}>
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-950"><Trophy className="w-5 h-5" /></div>
            <h1 className="font-black text-lg text-white">MEGA RIFAS <span className="text-emerald-400 text-xs">PRO</span></h1>
          </div>
          <nav className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'rifas', label: 'Rifas', icon: Ticket },
              { id: 'criar', label: 'Nova', icon: Plus },
              { id: 'afiliados', label: 'Afiliados', icon: Users },
              { id: 'sorteio', label: 'Sorteios', icon: Sparkles }
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setAba(t.id)} className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold ${aba === t.id ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-900'}`}>
                  <Icon className="w-3.5 h-3.5" /><span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-6">
        {aba === 'rifas' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <Flame className="w-5 h-5 text-emerald-400" />
                <select value={rifaSelecionada?.id || ''} onChange={e => setRifaSelecionada(rifas.find(r => r.id === e.target.value))} className="w-full md:w-80 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-bold">
                  {rifas.map(r => <option key={r.id} value={r.id}>{r.titulo} (R$ {r.preco_cota})</option>)}
                </select>
              </div>
              {rifaSelecionada && (
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard.writeText(window.location.origin); alert('Link copiado!'); }} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                    <Share2 className="w-4 h-4" /> Copiar Link
                  </button>
                  <button onClick={() => deletarRifa(rifaSelecionada.id)} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                    <Trash2 className="w-4 h-4" /> Excluir
                  </button>
                </div>
              )}
            </div>

            {rifaSelecionada ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className="flex flex-col md:flex-row gap-4 items-center border-b border-slate-800 pb-4 mb-4">
                      <img src={rifaSelecionada.imagem_url} alt="" className="w-full md:w-32 h-28 object-cover rounded-xl border border-slate-700" />
                      <div className="flex-1 space-y-1">
                        <h2 className="text-lg font-black text-white">{rifaSelecionada.titulo}</h2>
                        <p className="text-slate-400 text-xs">{rifaSelecionada.descricao}</p>
                        <p className="text-emerald-400 font-bold text-sm">R$ {rifaSelecionada.preco_cota.toFixed(2)} por cota</p>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">Progresso</span><span className="text-emerald-400">{progresso}%</span></div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: `${progresso}%` }}></div></div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      {[5, 10, 20, 50].map(q => <button key={q} onClick={() => adicionarLote(q)} className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold">+{q}</button>)}
                      {cotasSelecionadas.length > 0 && <button onClick={() => setCotasSelecionadas([])} className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg text-xs ml-auto font-bold">Limpar ({cotasSelecionadas.length})</button>}
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-h-72 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                      {Array.from({ length: rifaSelecionada.total_cotas }).map((_, idx) => {
                        const b = bilhetes.find(item => item.numero === idx);
                        let bg = 'bg-slate-900 text-slate-300';
                        if (b?.status === 'pago') bg = 'bg-emerald-500 text-slate-950 font-black';
                        else if (b?.status === 'reservado') bg = 'bg-amber-500 text-slate-950 font-black';
                        else if (cotasSelecionadas.includes(idx)) bg = 'bg-blue-600 text-white font-black ring-2 ring-blue-400';
                        return (
                          <button key={idx} disabled={b?.status === 'pago' || b?.status === 'reservado'} onClick={() => selecionarCota(idx)} className={`h-9 rounded-lg text-xs font-mono transition ${bg}`}>
                            {idx.toString().padStart(3, '0')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {cotasSelecionadas.length > 0 && (
                    <div className="bg-slate-900 border-2 border-emerald-500/40 p-5 rounded-2xl space-y-3">
                      <h3 className="font-extrabold text-white text-sm">Reservar {cotasSelecionadas.length} cota(s) - Total: R$ {(cotasSelecionadas.length * rifaSelecionada.preco_cota).toFixed(2)}</h3>
                      <form onSubmit={realizarReserva} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input type="text" placeholder="Nome" value={comprador.nome} onChange={e => setComprador({...comprador, nome: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
                        <input type="text" placeholder="WhatsApp" value={comprador.whatsapp} onChange={e => setComprador({...comprador, whatsapp: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
                        <select value={comprador.afiliado} onChange={e => setComprador({...comprador, afiliado: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white">
                          <option value="">Sem Afiliado</option>
                          {afiliados.map(a => <option key={a.id} value={a.codigo}>{a.nome} ({a.codigo})</option>)}
                        </select>
                        <button type="submit" disabled={loading} className="sm:col-span-3 bg-emerald-500 text-slate-950 font-black py-3 rounded-xl text-sm">Confirmar Reserva</button>
                      </form>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-fit space-y-3">
                  <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-400" /> Aprovações ({bilhetes.length})</h3>
                  <div className="space-y-2 max-h-[450px] overflow-y-auto">
                    {bilhetes.length === 0 ? <p className="text-slate-500 text-xs text-center py-4">Nenhum pedido.</p> : bilhetes.map(b => (
                      <div key={b.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <p className="font-mono text-emerald-400 font-bold text-xs">#{b.numero.toString().padStart(3, '0')} - {b.comprador_nome}</p>
                          <p className="text-[10px] text-slate-400">{b.comprador_whatsapp}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => atualizarStatusCota(b.id, b.status === 'reservado' ? 'pago' : 'reservado')} className={`p-2 rounded-lg text-xs ${b.status === 'reservado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => enviarWhatsApp(b)} className="bg-green-500/20 text-green-400 p-2 rounded-lg text-xs"><Send className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-900 rounded-2xl"><p className="text-slate-400 text-sm mb-3">Nenhuma rifa cadastrada.</p><button onClick={() => setAba('criar')} className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs">Criar Rifa</button></div>
            )}
          </div>
        )}

        {aba === 'criar' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-black text-white">Criar Nova Rifa</h2>
            <form onSubmit={criarRifa} className="space-y-3">
              <input type="text" placeholder="Título" value={novaRifa.titulo} onChange={e => setNovaRifa({...novaRifa, titulo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white" />
              <textarea placeholder="Descrição" value={novaRifa.descricao} onChange={e => setNovaRifa({...novaRifa, descricao: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white h-20 resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" step="0.01" placeholder="Preço" value={novaRifa.preco_cota} onChange={e => setNovaRifa({...novaRifa, preco_cota: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white" />
                <select value={novaRifa.total_cotas} onChange={e => setNovaRifa({...novaRifa, total_cotas: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white">
                  <option value={100}>100 Cotas</option><option value={1000}>1.000 Cotas</option><option value={10000}>10.000 Cotas</option>
                </select>
              </div>
              <label className="flex cursor-pointer bg-slate-950 border border-dashed border-slate-700 rounded-xl p-3 text-xs text-slate-300 justify-center items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" /> {uploading ? 'Enviando...' : 'Escolher foto'}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
              <button type="submit" disabled={loading || uploading} className="w-full bg-emerald-500 text-slate-950 font-black py-3 rounded-xl text-sm">Publicar Rifa</button>
            </form>
          </div>
        )}

        {aba === 'afiliados' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-white text-sm">Novo Afiliado</h3>
              <form onSubmit={criarAfiliado} className="space-y-2.5">
                <input type="text" placeholder="Nome" value={novoAfiliado.nome} onChange={e => setNovoAfiliado({...novoAfiliado, nome: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
                <input type="text" placeholder="Código (ex: joao10)" value={novoAfiliado.codigo} onChange={e => setNovoAfiliado({...novoAfiliado, codigo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
                <input type="number" placeholder="Comissão %" value={novoAfiliado.comissao_porcentagem} onChange={e => setNovoAfiliado({...novoAfiliado, comissao_porcentagem: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
                <input type="text" placeholder="Chave Pix" value={novoAfiliado.pix_chave} onChange={e => setNovoAfiliado({...novoAfiliado, pix_chave: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white" />
                <button type="submit" className="w-full bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs">Cadastrar</button>
              </form>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-white text-sm">Afiliados Ativos</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {afiliados.map(a => (
                  <div key={a.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div><p className="font-bold text-xs text-white">{a.nome} ({a.codigo})</p><p className="text-[10px] text-slate-400">Comissão: {a.comissao_porcentagem}%</p></div>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${a.codigo}`); alert('Link copiado!'); }} className="bg-slate-800 text-slate-200 p-2 rounded-lg text-xs"><Share2 className="w-3.5 h-3.5 text-emerald-400" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {aba === 'sorteio' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-center">
              <h3 className="font-bold text-white text-sm">Loteria Federal</h3>
              <input type="number" placeholder="1º prêmio ex: 85432" value={numFederal} onChange={e => setNumFederal(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-white font-mono text-lg" />
              <button onClick={calcularFederal} className="w-full bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs">Apurar Ganhador</button>
              {ganhadorFederal && <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/40"><p className="text-xs text-amber-400 font-bold">#{ganhadorFederal.numero.toString().padStart(3, '0')}</p><p className="text-sm font-bold text-white">{ganhadorFederal.comprador}</p></div>}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-center">
              <h3 className="font-bold text-white text-sm">Roleta Ao Vivo</h3>
              <div className="py-4 bg-slate-950 rounded-xl border border-slate-800">
                {ganhadorRoleta ? <div><p className="text-2xl font-mono font-black text-white">#{ganhadorRoleta.numero.toString().padStart(3, '0')}</p><p className="text-xs text-emerald-400 font-bold">{ganhadorRoleta.comprador_nome}</p></div> : <Sparkles className="w-6 h-6 text-emerald-400 mx-auto animate-pulse" />}
              </div>
              <button onClick={rodarRoleta} disabled={roletando} className="w-full bg-emerald-500 text-slate-950 font-black py-2.5 rounded-xl text-xs">{roletando ? 'Girando...' : 'Girar Roleta'}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
