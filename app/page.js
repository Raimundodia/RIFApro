'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Plus, Ticket, Users, Trophy, DollarSign, CheckCircle, 
  Trash2, Send, Shuffle, Sparkles, AlertCircle, RefreshCw, 
  ShieldCheck, Share2, Flame, ArrowRight, Upload, Image as ImageIcon
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

  // Upload de Imagem para o Supabase Storage
  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('rifas')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('rifas').getPublicUrl(filePath);
      setNovaRifa({ ...novaRifa, imagem_url: data.publicUrl });
      alert('Foto enviada com sucesso!');
    } catch (error) {
      alert('Erro ao enviar imagem: ' + error.message);
    } finally {
      setUploading(false);
    }
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
      alert('Cotas reservadas com sucesso! Aguardando pagamento.');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
      
      {/* HEADER E MENU ADMINISTRATIVO COMPLETO */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setAba('rifas')}>
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-2.5 rounded-2xl text-slate-950 font-bold shadow-lg">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-wider text-white">MEGA RIFAS <span className="text-emerald-400 text-xs">PRO</span></h1>
              <p className="text-[10px] text-slate-400">Painel Administrativo & Vendas</p>
            </div>
          </div>

          {/* Abas Administrativas (Visíveis em qualquer tela) */}
          <nav className="flex flex-wrap justify-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            {[
              { id: 'rifas', label: 'Rifas & Vendas', icon: Ticket },
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
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    ativo ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-6">

        {/* 1. ABA RIFAS E APROVAÇÕES */}
        {aba === 'rifas' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl">
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <Flame className="w-6 h-6 text-emerald-400" />
                <div className="w-full md:w-80">
                  <label className="text-xs text-slate-400 block mb-1 font-semibold">Selecione a Campanha</label>
                  <select 
                    value={rifaSelecionada?.id || ''} 
                    onChange={(e) => setRifaSelecionada(rifas.find(r => r.id === e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold outline-none text-sm"
                  >
                    {rifas.map(r => (
                      <option key={r.id} value={r.id}>{r.titulo} (R$ {r.preco_cota.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              </div>

              {rifaSelecionada && (
                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                  <button 
                    onClick={() => {
                      const link = `${window.location.origin}`;
                      navigator.clipboard.writeText(link);
                      alert('Link da rifa copiado para divulgação!');
                    }}
                    className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 px-4 py-2.5 rounded-xl transition text-xs font-bold border border-emerald-500/20"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Copiar Link de Divulgação</span>
                  </button>
                  <button 
                    onClick={() => deletarRifa(rifaSelecionada.id)}
                    className="flex items-center space-x-1.5 text-red-400 bg-red-500/10 hover:bg-red-600 hover:text-white px-4 py-2.5 rounded-xl transition text-xs font-bold border border-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                </div>
              )}
            </div>

            {rifaSelecionada ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Grade de Bilhetes e Prémio */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                    <div className="flex flex-col md:flex-row gap-5 items-center border-b border-slate-800 pb-5 mb-5">
                      <img src={rifaSelecionada.imagem_url} alt="" className="w-full md:w-36 h-32 object-cover rounded-2xl border border-slate-700 shadow-md" />
                      <div className="flex-1 space-y-1.5 text-center md:text-left">
                        <span className="px-3 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">Ativa</span>
                        <h2 className="text-xl font-black text-white">{rifaSelecionada.titulo}</h2>
                        <p className="text-slate-400 text-xs">{rifaSelecionada.descricao}</p>
                        <div className="pt-1 flex gap-4 justify-center md:justify-start">
                          <div><span className="text-[10px] text-slate-500 block">Cota</span><span className="text-base font-black text-emerald-400">R$ {rifaSelecionada.preco_cota.toFixed(2)}</span></div>
                          <div className="border-l border-slate-800 pl-4"><span className="text-[10px] text-slate-500 block">Total</span><span className="text-sm font-bold text-slate-200">{rifaSelecionada.total_cotas} Cotas</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Progresso de Vendas</span>
                        <span className="text-emerald-400">{progresso}% ({totalPagos + totalReservados}/{rifaSelecionada.total_cotas})</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progresso}%` }}></div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-xs text-slate-400 block mb-2 font-semibold">⚡ Seleção Rápida:</span>
                      <div className="flex flex-wrap gap-2">
                        {[5, 10, 20, 50].map((qtd) => (
                          <button key={qtd} onClick={() => adicionarLote(qtd)} className="bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs transition">
                            +{qtd}
                          </button>
                        ))}
                        {cotasSelecionadas.length > 0 && (
                          <button onClick={() => setCotasSelecionadas([])} className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-xl text-xs font-semibold ml-auto">
                            Limpar ({cotasSelecionadas.length})
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Grade Numerada */}
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-h-[350px] overflow-y-auto p-3 bg-slate-950 rounded-2xl border border-slate-800">
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
                            className={`h-10 rounded-xl flex items-center justify-center text-xs font-mono transition border ${bg}`}
                          >
                            {index.toString().padStart(3, '0')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Formulário de Reserva */}
                  {cotasSelecionadas.length > 0 && (
                    <div className="bg-slate-900 border-2 border-emerald-500/40 p-6 rounded-3xl shadow-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <h3 className="font-extrabold text-white text-sm">Reservar ({cotasSelecionadas.length} cotas)</h3>
                        <span className="text-lg font-black text-emerald-400">R$ {(cotasSelecionadas.length * rifaSelecionada.preco_cota).toFixed(2)}</span>
                      </div>
                      <form onSubmit={realizarReserva} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input type="text" placeholder="Nome Completo" value={comprador.nome} onChange={e => setComprador({...comprador, nome: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-emerald-500" />
                        <input type="text" placeholder="WhatsApp (com DDD)" value={comprador.whatsapp} onChange={e => setComprador({...comprador, whatsapp: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-emerald-500" />
                        <select value={comprador.afiliado} onChange={e => setComprador({...comprador, afiliado: e.target.value})} className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none">
                          <option value="">Sem Afiliado</option>
                          {afiliados.map(a => <option key={a.id} value={a.codigo}>{a.nome} ({a.codigo})</option>)}
                        </select>
                        <button type="submit" disabled={loading} className="sm:col-span-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition text-sm">
                          Confirmar Reserva de Bilhetes
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Painel de Aprovação (Admin) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 h-fit space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <h3 className="font-extrabold text-white text-sm flex items-center space-x-2"><DollarSign className="w-4 h-4 text-emerald-400" /><span>Aprovações Pix</span></h3>
                    <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full font-bold">{bilhetes.length}</span>
                  </div>
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                    {bilhetes.length === 0 ? (
                      <p className="text-slate-500 text-xs text-center py-6">Nenhum pedido registrado.</p>
                    ) : (
                      bilhetes.map(b => (
                        <div key={b.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-black text-emerald-400 text-xs">#{b.numero.toString().padStart(3, '0')}</span>
                              <span className="text-xs font-bold text-white">{b.comprador_nome}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">{b.comprador_whatsapp}</span>
                            {b.afiliado_codigo && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">Afiliado: {b.afiliado_codigo}</span>}
                          </div>
                          <div className="flex space-x-1">
                            {b.status === 'reservado' ? (
                              <button onClick={() => atualizarStatusCota(b.id, 'pago')} className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 p-2 rounded-xl transition" title="Aprovar">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button onClick={() => atualizarStatusCota(b.id, 'reservado')} className="bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 p-2 rounded-xl transition" title="Voltar">
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => enviarWhatsApp(b)} className="bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-slate-950 p-2 rounded-xl transition" title="WhatsApp">
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
              <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl">
                <p className="text-slate-400 mb-3 text-sm">Nenhuma rifa cadastrada no momento.</p>
                <button onClick={() => setAba('criar')} className="bg-emerald-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs">Criar Primeira Rifa</button>
              </div>
            )}
          </div>
        )}

        {/* 2. ABA CRIAR RIFA (COM UPLOAD DE FOTO) */}
        {aba === 'criar' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-5">
            <h2 className="text-xl font-black text-white flex items-center space-x-2"><Plus className="text-emerald-400 w-5 h-5" /><span>Criar Nova Rifa</span></h2>
            <form onSubmit={criarRifa} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Título do Prémio</label>
                <input type="text" placeholder="Ex: iPhone 15 Pro Max" value={novaRifa.titulo} onChange={e => setNovaRifa({...novaRifa, titulo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs outline-none" />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Descrição</label>
                <textarea placeholder="Detalhes da rifa..." value={novaRifa.descricao} onChange={e => setNovaRifa({...novaRifa, descricao: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs outline-none h-20 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Preço por Cota (R$)</label>
                  <input type="number" step="0.01" placeholder="10.00" value={novaRifa.preco_cota} onChange={e => setNovaRifa({...novaRifa, preco_cota: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Total de Cotas</label>
                  <select value={novaRifa.total_cotas} onChange={e => setNovaRifa({...novaRifa, total_cotas: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs outline-none">
                    <option value={100}>100 Cotas</option>
                    <option value={1000}>1.000 Cotas</option>
                    <option value={10000}>10.000 Cotas</option>
                  </select>
                </div>
              </div>

              {/* UPLOAD DE FOTO DIRETO */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Foto da Capa da Rifa (Upload direto)</label>
                <div className="flex items-center space-x-3">
                  <label className="flex-1 cursor-pointer bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl px-4 py-3 text-center text-xs text-slate-300 transition flex items-center justify-center space-x-2">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>{uploading ? 'Enviando foto...' : 'Escolher foto do celular/PC'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  </label>
                </div>
                {novaRifa.imagem_url && (
                  <p className="text-[10px] text-emerald-400 mt-1 truncate">✔ Imagem carregada com sucesso!</p>
                )}
              </div>

              <button type="submit" disabled={loading || uploading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl transition text-sm">
                Publicar Rifa
              </button>
            </form>
          </div>
        )}

        {/* 3. ABA AFILIADOS */}
        {aba === 'afiliados' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-white text-sm flex items-center space-x-2"><Users className="text-emerald-400 w-4 h-4" /><span>Novo Afiliado</span></h3>
              <form onSubmit={criarAfiliado} className="space-y-3">
                <input type="text" placeholder="Nome" value={novoAfiliado.nome} onChange={e => setNovoAfiliado({...novoAfiliado, nome: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none" />
                <input type="text" placeholder="Código (ex: pedro10)" value={novoAfiliado.codigo} onChange={e => setNovoAfiliado({...novoAfiliado, codigo: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none" />
                <input type="number" placeholder="Comissão (%)" value={novoAfiliado.comissao_porcentagem} onChange={e => setNovoAfiliado({...novoAfiliado, comissao_porcentagem: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none" />
                <input type="text" placeholder="Chave Pix" value={novoAfiliado.pix_chave} onChange={e => setNovoAfiliado({...novoAfiliado, pix_chave: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none" />
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl transition text-xs">Cadastrar Afiliado</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <h3 className="font-extrabold text-white text-sm mb-4">Afiliados Ativos</h3>
              <div className="space-y-3">
                {afiliados.length === 0 ? <p className="text-slate-500 text-xs">Nenhum afiliado cadastrado.</p> : afiliados.map(a => (
                  <div key={a.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs">{a.nome}</h4>
                      <p className="text-[10px] text-slate-400">Código: <span className="text-emerald-400 font-mono font-bold">?ref={a.codigo}</span> | Comissão: {a.comissao_porcentagem}%</p>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${a.codigo}`); alert('Link do afiliado copiado!'); }} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5">
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" /><span>Copiar Link</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. ABA SORTEIOS */}
        {aba === 'sorteio' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-base text-white flex items-center space-x-2"><Trophy className="text-amber-400 w-5 h-5" /><span>Loteria Federal</span></h3>
              <p className="text-xs text-slate-400">Insira o 1º prêmio da Caixa para calcular o bilhete premiado.</p>
              <input type="number" placeholder="Ex: 85432" value={numFederal} onChange={e => setNumFederal(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-mono text-center outline-none" />
              <button onClick={calcularFederal} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl transition text-xs">Apurar Ganhador</button>
              {ganhadorFederal && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/40 text-center space-y-1">
                  <span className="text-[10px] text-amber-400 font-extrabold uppercase">Bilhete Premiado</span>
                  <span className="text-3xl font-mono font-black text-white">#{ganhadorFederal.numero.toString().padStart(3, '0')}</span>
                  <p className="text-sm text-slate-200 font-bold">{ganhadorFederal.comprador}</p>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-base text-white flex items-center space-x-2"><Shuffle className="text-emerald-400 w-5 h-5" /><span>Roleta Ao Vivo</span></h3>
              <p className="text-xs text-slate-400">Sortear entre todos os bilhetes pagos.</p>
              <div className="py-6 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                {ganhadorRoleta ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Ganhador Sorteado</span>
                    <h4 className="text-4xl font-mono font-black text-white">#{ganhadorRoleta.numero.toString().padStart(3, '0')}</h4>
                    <p className="text-base font-bold text-emerald-400">{ganhadorRoleta.comprador_nome}</p>
                  </div>
                ) : (
                  <Sparkles className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
                )}
              </div>
              <button onClick={
