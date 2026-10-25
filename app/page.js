'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Plus, Ticket, Users, Trophy, DollarSign, CheckCircle, 
  Trash2, Send, Shuffle, Sparkles, AlertCircle, RefreshCw, 
  ShieldCheck, Share2, Flame, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Home() {
  const [aba, setAba] = useState('rifas');
  const [rifas, setRifas] = useState([]);
  const [rifaSelecionada, setRifaSelecionada] = useState(null);
  const [bilhetes, setBilhetes] = useState([]);
  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(false);

  const [novaRifa, setNovaRifa] = useState({
    titulo: '', descricao: '', preco_cota: '', total_cotas: 100, imagem_url: ''
  });

  const [novoAfiliado, setNovoAfiliado] = useState({
    nome: '', codigo: '', comissao_porcentagem: 10, pix_chave: ''
  });

  const [cotasSelecionadas, setCotasSelecionadas] = useState([]);
  const [comprador, setComprador] = useState({ nome: '', whatsapp: '', afiliado: '' });

  const [numFederal, setNumFederal] = useState('');
  const [ganhadorFederal, setGanhadorFederal] = useState(null);
  const [ganhadorRoleta, setGanhadorRoleta] = useState(null);
  const [roletando, setRoletando] = useState(false);

  useEffect(() => {
    carregarRifas();
    carregarAfiliados();
  }, []);

  useEffect(() => {
    if (rifaSelecionada) carregarBilhetes(rifaSelecionada.id);
  }, [rifaSelecionada]);

  const carregarRifas = async () => {
    setLoading(true);
    const { data } = await supabase.from('rifas').select('*').order('created_at', { ascending: false });
    if (data) {
      setRifas(data);
      if (data.length > 0 && !rifaSelecionada) setRifaSelecionada(data[0]);
    }
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

  const criarRifa = async (e) => {
    e.preventDefault();
    if (!novaRifa.titulo || !novaRifa.preco_cota) return alert('Preencha os campos obrigatórios!');

    setLoading(true);
    const { data, error } = await supabase.from('rifas').insert([{
      titulo: novaRifa.titulo,
      descricao: novaRifa.descricao,
      preco_cota: parseFloat(novaRifa.preco_cota),
      total_cotas: parseInt(novaRifa.total_cotas),
      imagem_url: novaRifa.imagem_url || 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800'
    }]).select();

    if (error) {
      alert('Erro: ' + error.message);
    } else {
      alert('Rifa criada com sucesso!');
      setNovaRifa({ titulo: '', descricao: '', preco_cota: '', total_cotas: 100, imagem_url: '' });
      carregarRifas();
      if (data && data[0]) setRifaSelecionada(data[0]);
      setAba('rifas');
    }
    setLoading(false);
  };

  const deletarRifa = async (id) => {
    if (!confirm('Deseja apagar esta rifa e seus bilhetes?')) return;
    setLoading(true);
    const { error } = await supabase.from('rifas').delete().eq('id', id);
    if (error) {
      alert('Erro: ' + error.message);
    } else {
      alert('Rifa apagada!');
      setRifaSelecionada(null);
      carregarRifas();
    }
    setLoading(false);
  };

  const criarAfiliado = async (e) => {
    e.preventDefault();
    if (!novoAfiliado.nome || !novoAfiliado.codigo) return alert('Preencha nome e código!');

    const { error } = await supabase.from('afiliados').insert([{
      nome: novoAfiliado.nome,
      codigo: novoAfiliado.codigo.toLowerCase().trim(),
      comissao_porcentagem: parseFloat(novoAfiliado.comissao_porcentagem),
      pix_chave: novoAfiliado.pix_chave
    }]);

    if (error) {
      alert('Erro: ' + error.message);
    } else {
      alert('Afiliado cadastrado!');
      setNovoAfiliado({ nome: '', codigo: '', comissao_porcentagem: 10, pix_chave: '' });
      carregarAfiliados();
    }
  };

  const selecionarCota = (num) => {
    if (cotasSelecionadas.includes(num)) {
      setCotasSelecionadas(cotasSelecionadas.filter(n => n !== num));
    } else {
      if (cotasSelecionadas.length >= 20) return alert('Máximo de 20 cotas por vez.');
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
    if (cotasSelecionadas.length === 0) return alert('Selecione cotas!');
    if (!comprador.nome || !comprador.whatsapp) return alert('Informe Nome e WhatsApp!');

    setLoading(true);
    const registros = cotasSelecionadas.map(num => ({
      rifa_id: rifaSelecionada.id,
      numero: num,
      status: 'reservado',
      comprador_nome: comprador.nome,
      comprador_whatsapp: comprador.whatsapp,
      afiliado_codigo: comprador.afiliado || null
    }));

    const { error } = await supabase.from('bilhetes').insert(registros);
    if (error) {
      alert('Erro ao reservar: ' + error.message);
    } else {
      alert('Cotas reservadas com sucesso!');
      setCotasSelecionadas([]);
      setComprador({ nome: '', whatsapp: '', afiliado: '' });
      carregarBilhetes(rifaSelecionada.id);
    }
    setLoading(false);
  };

  const atualizarStatusCota = async (bilheteId, novoStatus) => {
    const { error } = await supabase.from('bilhetes').update({ status: novoStatus }).eq('id', bilheteId);
    if (!error && rifaSelecionada) carregarBilhetes(rifaSelecionada.id);
  };

  const enviarWhatsApp = (bilhete) => {
    if (!rifaSelecionada) return;
    const texto = `Olá *${bilhete.comprador_nome}*! 🚀\n\nBilhete confirmado na rifa *${rifaSelecionada.titulo}*!\n🎟️ Número: *#${bilhete.numero.toString().padStart(3, '0')}*\nStatus: *${bilhete.status.toUpperCase()}*\n\nBoa sorte! 🍀`;
    window.open(`https://wa.me/55${bilhete.comprador_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const calcularFederal = () => {
    if (!numFederal || !rifaSelecionada) return;
    const num = parseInt(numFederal);
    const numeroGanhador = num % rifaSelecionada.total_cotas;
    const bilheteGanhador = bilhetes.find(b => b.numero === numeroGanhador && b.status === 'pago');

    setGanhadorFederal({
      numero: numeroGanhador,
      comprador: bilheteGanhador ? bilheteGanhador.comprador_nome : 'Cota não paga ou livre',
      whatsapp: bilheteGanhador ? bilheteGanhador.comprador_whatsapp : '-'
    });
    confetti();
  };

  const rodarRoleta = () => {
    const pagos = bilhetes.filter(b => b.status === 'pago');
    if (pagos.length === 0) return alert('Nenhum bilhete pago para sortear!');

    setRoletando(true);
    let contador = 0;
    const interval = setInterval(() => {
      setGanhadorRoleta(pagos[Math.floor(Math.random() * pagos.length)]);
      contador++;
      if (contador > 25) {
        clearInterval(interval);
        setRoletando(false);
        confetti();
      }
    }, 80);
  };

  const totalPagos = bilhetes.filter(b => b.status === 'pago').length;
  const totalReservados = bilhetes.filter(b => b.status === 'reservado').length;
  const progresso = rifaSelecionada ? Math.round(((totalPagos + totalReservados) / rifaSelecionada.total_cotas) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 font-sans">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setAba('rifas')}>
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-3 rounded-2xl text-slate-950 font-bold">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-wider text-white">MEGA RIFAS <span className="text-emerald-400 text-sm">PRO</span></h1>
              <p className="text-xs text-slate-400">Sistema Automatizado</p>
            </div>
          </div>

          <nav className="flex space-x-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            {[
              { id: 'rifas', label: 'Rifas', icon: Ticket },
              { id: 'criar', label: 'Nova Rifa', icon: Plus },
              { id: 'afiliados', label: 'Afiliados', icon: Users },
              { id: 'sorteio', label: 'Sorteios', icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              const ativo = aba === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAba(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                    ativo ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8">
        {aba === 'rifas' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <Flame className="w-6 h-6 text-emerald-400" />
                <div className="w-full md:w-80">
                  <label className="text-xs text-slate-400 block mb-1 font-semibold">Campanha Ativa</label>
                  <select 
                    value={rifaSelecionada?.id || ''} 
                    onChange={(e) => setRifaSelecionada(rifas.find(r => r.id === e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold outline-none"
                  >
                    {rifas.map(r => (
                      <option key={r.id} value={r.id}>{r.titulo} (R$ {r.preco_cota.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              </div>
              {rifaSelecionada && (
                <button 
                  onClick={() => deletarRifa(rifaSelecionada.id)}
                  className="flex items-center space-x-2 text-red-400 bg-red-500/10 hover:bg-red-600 hover:text-white px-4 py-3 rounded-xl transition text-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Campanha</span>
                </button>
              )}
            </div>

            {rifaSelecionada ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row gap-6 items-center border-b border-slate-800 pb-6 mb-6">
                      <img src={rifaSelecionada.imagem_url} alt="" className="w-full md:w-44 h-36 object-cover rounded-2xl border border-slate-700" />
                      <div className="flex-1 space-y-2 text-center md:text-left">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">Sorteio Seguro</span>
                        <h2 className="text-2xl font-black text-white">{rifaSelecionada.titulo}</h2>
                        <p className="text-slate-400 text-sm">{rifaSelecionada.descricao}</p>
                        <div className="pt-2 flex gap-4 justify-center md:justify-start">
                          <div><span className="text-xs text-slate-500 block">Preço</span><span className="text-xl font-black text-emerald-400">R$ {rifaSelecionada.preco_cota.toFixed(2)}</span></div>
                          <div className="border-l border-slate-800 pl-4"><span className="text-xs text-slate-500 block">Total</span><span className="text-lg font-bold text-slate-200">{rifaSelecionada.total_cotas} Cotas</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Progresso</span>
                        <span className="text-emerald-400">{progresso}% Vendido</span>
                      </div>
                      <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progresso}%` }}></div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-xs text-slate-400 block mb-2 font-semibold">⚡ Compra Rápida:</span>
                      <div className="flex flex-wrap gap-2">
                        {[5, 10, 20, 50].map((qtd) => (
                          <button key={qtd} onClick={() => adicionarLote(qtd)} className="bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs transition">
                            +{qtd} Cotas
                          </button>
                        ))}
                        {cotasSelecionadas.length > 0 && (
                          <button onClick={() => setCotasSelecionadas([])} className="bg-red-500/10 text-red-400 px-3 py-2 rounded-xl text-xs font-semibold ml-auto">
                            Limpar ({cotasSelecionadas.length})
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-[380px] overflow-y-auto p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      {Array.from({ length: rifaSelecionada.total_cotas }).map((_, index) => {
                        const bilhete = bilhetes.find(b => b.numero === index);
                        let bg = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800';
                        if (bilhete?.status === 'pago') bg = 'bg-emerald-500 text-slate-950 font-black';
                        else if (bilhete?.status === 'reservado') bg = 'bg-amber-500 text-slate-950 font-black';
                        else if (cotasSelecionadas.includes(index)) bg = 'bg-blue-600 text-white font-black scale-105 ring-2 ring-blue-400';

                        return (
                          <button
                            key={index}
                            disabled={bilhete?.status === 'pago' || bilhete?.status === 'reservado'}
                            onClick={() => selecionarCota(index)}
                            className={`h-11 rounded-xl flex items-center justify-center text-xs font-mono transition border ${bg}`}
                          >
                            {index.toString().padStart(3, '0')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {cotasSelecionadas.length > 0 && (
                    <div className="bg-slate-900 border-2 border-emerald-500/40 p-6 rounded-3xl shadow-2xl space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                        <h3 className="font-extrabold text-white">Reservar ({cotasSelecionadas.length} cotas)</h3>
                        <span className="text-xl font-black text-emerald-400">R$ {(cotasSelecionadas.length * rifaSelecionada.preco_cota).toFixed(2)}</span>
                      </div>
                      <form onSubmit={realizarReserva} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input type="text" placeholder="Nome Completo" value={comprador.nome} onChange={e => setComprador({...comprador, nome: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500" />
                        <input type="text" placeholder="WhatsApp (com DDD)" value={comprador.whatsapp} onChange={e => setComprador({...comprador, whatsapp: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500" />
                        <select value={comprador.afiliado} onChange={e => setComprador({...comprador, afiliado: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none">
                          <option value="">Sem Afiliado</option>
                          {afiliados.map(a => <option key={a.id} value={a.codigo}>{a.nome} ({a.codigo})</option>)}
                        </select>
                        <button type="submit" disabled={loading} className="sm:col-span-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition">
                          Confirmar Reserva de Bilhetes
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h3 className="font-extrabold text-white flex items-center space-x-2"><DollarSign className="w-5 h-5 text-emerald-400" /><span>Aprovações</span></h3>
                    <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full font-bold">{bilhetes.length}</span>
                  </div>
                  <div className="space-y-3 max-h-[550px] overflow-y-auto">
                    {bilhetes.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-8">Nenhum pedido ainda.</p>
                    ) : (
                      bilhetes.map(b => (
                        <div key={b.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-black text-emerald-400">#{b.numero.toString().padStart(3, '0')}</span>
                              <span className="text-sm font-bold text-white">{b.comprador_nome}</span>
                            </div>
                            <span className="text-xs text-slate-400 block">{b.comprador_whatsapp}</span>
                            {b.afiliado_codigo && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full mt-1 inline-block">Afiliado: {b.afiliado_codigo}</span>}
                          </div>
                          <div className="flex space-x-1.5">
                            {b.status === 'reservado' ? (
                              <button onClick={() => atualizarStatusCota(b.id, 'pago')} className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 p-2.5 rounded-xl transition" title="Aprovar">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button onClick={() => atualizarStatusCota(b.id, 'reservado')} className="bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 p-2.5 rounded-xl transition" title="Voltar">
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => enviarWhatsApp(b)} className="bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-slate-950 p-2.5 rounded-xl transition" title="WhatsApp">
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl">
                <p className="text-slate-400 mb-4">Nenhuma rifa cadastrada.</p>
                <button onClick={() => setAba('criar')} className="bg-emerald-500 text-slate-950 font-black px-6 py-3 rounded-xl">Criar Rifa</button>
              </div>
            )}
          </div>
        )}

        {aba === 'criar' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <h2 className="text-2xl font-black text-white flex items-center space-x-2"><Plus className="text-emerald-400" /><span>Nova Campanha</span></h2>
            <form onSubmit={criarRifa} className="space-y-4">
              <div><label className="text-xs text-slate-400 block mb-1">Título</label><input type="text" placeholder="Ex: iPhone 15" value={novaRifa.titulo} onChange={e => setNovaRifa({...novaRifa, titulo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" /></div>
              <div><label className="text-xs text-slate-400 block mb-1">Descrição</label><textarea placeholder="Detalhes..." value={novaRifa.descricao} onChange={e => setNovaRifa({...novaRifa, descricao: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none h-24 resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-slate-400 block mb-1">Preço por Cota (R$)</label><input type="number" step="0.01" placeholder="10.00" value={novaRifa.preco_cota} onChange={e => setNovaRifa({...novaRifa, preco_cota: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Total de Cotas</label><select value={novaRifa.total_cotas} onChange={e => setNovaRifa({...novaRifa, total_cotas: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"><option value={100}>100</option><option value={1000}>1.000</option><option value={10000}>10.000</option></select></div>
              </div>
              <div><label className="text-xs text-slate-400 block mb-1">URL da Imagem</label><input type="url" placeholder="https://..." value={novaRifa.imagem_url} onChange={e => setNovaRifa({...novaRifa, imagem_url: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none" /></div>
              <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition">Publicar Campanha</button>
            </form>
          </div>
        )}

        {aba === 'afiliados' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-white flex items-center space-x-2"><Users className="text-emerald-400" /><span>Novo Afiliado</span></h3>
              <form onSubmit={criarAfiliado} className="space-y-3">
                <input type="text" placeholder="Nome" value={novoAfiliado.nome} onChange={e => setNovoAfiliado({...novoAfiliado, nome: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none" />
                <input type="text" placeholder="Código (ex: pedro10)" value={novoAfiliado.codigo} onChange={e => setNovoAfiliado({...novoAfiliado, codigo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none" />
                <input type="number" placeholder="Comissão (%)" value={novoAfiliado.comissao_porcentagem} onChange={e => setNovoAfiliado({...novoAfiliado, comissao_porcentagem: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none" />
                <input type="text" placeholder="Chave Pix" value={novoAfiliado.pix_chave} onChange={e => setNovoAfiliado({...novoAfiliado, pix_chave: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none" />
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition text-sm">Cadastrar</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <h3 className="font-extrabold text-white mb-4">Afiliados Ativos</h3>
              <div className="space-y-3">
                {afiliados.length === 0 ? <p className="text-slate-500 text-sm">Nenhum afiliado.</p> : afiliados.map(a => (
                  <div key={a.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">{a.nome}</h4>
                      <p className="text-xs text-slate-400">Código: <span className="text-emerald-400 font-mono font-bold">?ref={a.codigo}</span> | Comissão: {a.comissao_porcentagem}%</p>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${a.codigo}`); alert('Link copiado!'); }} className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5">
                      <Share2 className="w-4 h-4 text-emerald-400" /><span>Copiar Link</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {aba === 'sorteio' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-xl text-white flex items-center space-x-2"><Trophy className="text-amber-400" /><span>Loteria Federal</span></h3>
              <p className="text-sm text-slate-400">Insira o 1º prêmio da Caixa para calcular o ganhador.</p>
              <input type="number" placeholder="Ex: 85432" value={numFederal} onChange={e => setNumFederal(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white text-xl font-mono text-center outline-none" />
              <button onClick={calcularFederal} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl transition">Apurar Ganhador</button>
              {ganhadorFederal && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-amber-500/40 text-center space-y-2">
                  <span className="text-xs text-amber-400 font-extrabold uppercase">Bilhete Premiado</span>
                  <span className="text-4xl font-mono font-black text-white">#{ganhadorFederal.numero.toString().padStart(3, '0')}</span>
                  <p className="text-base text-slate-200 font-bold">{ganhadorFederal.comprador}</p>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-xl text-white flex items-center space-x-2"><Shuffle className="text-emerald-400" /><span>Roleta Ao Vivo</span></h3>
              <p className="text-sm text-slate-400">Sortear entre todos os bilhetes PAGOS.</p>
              <div className="py-6 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                {ganhadorRoleta ? (
                  <div className="space-y-1">
                    <span className="text-xs text-emerald-400 font-bold uppercase">Ganhador Sorteado</span>
                    <h4 className="text-5xl font-mono font-black text-white">#{ganhadorRoleta.numero.toString().padStart(3, '0')}</h4>
                    <p className="text-lg font-bold text-emerald-400">{ganhadorRoleta.comprador_nome}</p>
                  </div>
                ) : (
                  <Sparkles className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
                )}
              </div>
              <button onClick={rodarRoleta} disabled={roletando} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl transition">
                {roletando ? 'Girando...' : 'Girar Roleta'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
