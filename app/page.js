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
    titulo: '',
    descricao: '',
    preco_cota: '',
    total_cotas: 100,
    imagem_url: ''
  });

  const [novoAfiliado, setNovoAfiliado] = useState({
    nome: '',
    codigo: '',
    comissao_porcentagem: 10,
    pix_chave: ''
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
    if (rifaSelecionada) {
      carregarBilhetes(rifaSelecionada.id);
    }
  }, [rifaSelecionada]);

  const carregarRifas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('rifas').select('*').order('created_at', { ascending: false });
    if (!error && data) {
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
      alert('Erro ao criar rifa: ' + error.message);
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
    if (!confirm('Deseja realmente apagar esta rifa e todos os seus bilhetes?')) return;
    setLoading(true);
    const { error } = await supabase.from('rifas').delete().eq('id', id);
    if (error) {
      alert('Erro ao apagar rifa: ' + error.message);
    } else {
      alert('Rifa apagada com sucesso!');
      setRifaSelecionada(null);
      carregarRifas();
    }
    setLoading(false);
  };

  const criarAfiliado = async (e) => {
    e.preventDefault();
    if (!novoAfiliado.nome || !novoAfiliado.codigo) return alert('Preencha o nome e o código!');

    const { error } = await supabase.from('afiliados').insert([{
      nome: novoAfiliado.nome,
      codigo: novoAfiliado.codigo.toLowerCase().trim(),
      comissao_porcentagem: parseFloat(novoAfiliado.comissao_porcentagem),
      pix_chave: novoAfiliado.pix_chave
    }]);

    if (error) {
      alert('Erro ao criar afiliado: ' + error.message);
    } else {
      alert('Afiliado cadastrado com sucesso!');
      setNovoAfiliado({ nome: '', codigo: '', comissao_porcentagem: 10, pix_chave: '' });
      carregarAfiliados();
    }
  };

  const selecionarCota = (num) => {
    if (cotasSelecionadas.includes(num)) {
      setCotasSelecionadas(cotasSelecionadas.filter(n => n !== num));
    } else {
      if (cotasSelecionadas.length >= 20) {
        alert('Você pode selecionar no máximo 20 cotas por vez.');
        return;
      }
      setCotasSelecionadas([...cotasSelecionadas, num]);
    }
  };

  const adicionarLote = (qtd) => {
    if (!rifaSelecionada) return;
    const livres = [];
    for (let i = 0; i < rifaSelecionada.total_cotas; i++) {
      const ocupado = bilhetes.some(b => b.numero === i);
      if (!ocupado) livres.push(i);
    }
    const escolhidos = livres.slice(0, qtd);
    setCotasSelecionadas(escolhidos);
  };

  const realizarReserva = async (e) => {
    e.preventDefault();
    if (cotasSelecionadas.length === 0) return alert('Selecione pelo menos uma cota!');
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
      alert('Erro ao reservar cotas: ' + error.message);
    } else {
      alert('Cotas reservadas! Realize o pagamento via Pix para confirmar.');
      setCotasSelecionadas([]);
      setComprador({ nome: '', whatsapp: '', afiliado: '' });
      carregarBilhetes(rifaSelecionada.id);
    }
    setLoading(false);
  };

  const atualizarStatusCota = async (bilheteId, novoStatus) => {
    const { error } = await supabase.from('bilhetes').update({ status: novoStatus }).eq('id', bilheteId);
    if (!error && rifaSelecionada) {
      carregarBilhetes(rifaSelecionada.id);
    }
  };

  const enviarWhatsApp = (bilhete) => {
    if (!rifaSelecionada) return;
    const texto = `Olá *${bilhete.comprador_nome}*! 🚀\n\nRecebemos a confirmação do seu bilhete na rifa *${rifaSelecionada.titulo}*!\n\n🎟️ Número: *#${bilhete.numero.toString().padStart(3, '0')}*\nStatus: *${bilhete.status.toUpperCase()}*\n\nBoa sorte no sorteio! 🍀`;
    const numLimpo = bilhete.comprador_whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/55${numLimpo}?text=${encodeURIComponent(texto)}`, '_blank');
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
    if (pagos.length === 0) return alert('Nenhum bilhete pago confirmado nesta rifa para sortear!');

    setRoletando(true);
    let contador = 0;
    const interval = setInterval(() => {
      const temp = pagos[Math.floor(Math.random() * pagos.length)];
      setGanhadorRoleta(temp);
      contador++;

      if (contador > 30) {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setAba('rifas')}>
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 p-3 rounded-2xl shadow-lg shadow-emerald-500/20 text-slate-950">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-wider bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                MEGA RIFAS <span className="text-emerald-400 text-sm font-bold px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">PRO</span>
              </h1>
              <p className="text-xs text-slate-400">Plataforma Automatizada de Prêmios & Afiliados</p>
            </div>
          </div>

          <nav className="flex space-x-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            {[
              { id: 'rifas', label: 'Rifas Ativas', icon: Ticket },
              { id: 'criar', label: '+ Nova Rifa', icon: Plus },
              { id: 'afiliados', label: 'Afiliados', icon: Users },
              { id: 'sorteio', label: 'Sorteios', icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              const ativo = aba === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAba(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    ativo 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.02]' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
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
          <div className="space-y-8 animate-fadeIn">
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-emerald-400">
                  <Flame className="w-6 h-6" />
                </div>
                <div className="w-full md:w-80">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Campanha Selecionada</label>
                  <select 
                    value={rifaSelecionada?.id || ''} 
                    onChange={(e) => setRifaSelecionada(rifas.find(r => r.id === e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner"
                  >
                    {rifas.map(r => (
                      <option key={r.id} value={r.id}>{r.titulo} — (R$ {r.preco_cota.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              </div>

              {rifaSelecionada && (
                <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                  <button 
                    onClick={() => deletarRifa(rifaSelecionada.id)}
                    className="flex items-center space-x-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/20 px-4 py-3 rounded-xl transition-all font-semibold text-sm shadow"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Campanha</span>
                  </button>
                </div>
              )}
            </div>

            {rifaSelecionada ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur">
                    
                    <div className="flex flex-col md:flex-row gap-6 items-center border-b border-slate-800/80 pb-6 mb-6">
                      <img 
                        src={rifaSelecionada.imagem_url} 
                        alt={rifaSelecionada.titulo} 
                        className="w-full md:w-44 h-36 object-cover rounded-2xl border border-slate-700/80 shadow-md"
                      />
                      <div className="flex-1 space-y-2 text-center md:text-left">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Sorteio Garantido & Seguro</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white">{rifaSelecionada.titulo}</h2>
                        <p className="text-slate-400 text-sm">{rifaSelecionada.descricao}</p>
                        <div className="pt-2 flex flex-wrap gap-4 justify-center md:justify-start items-center">
                          <div>
                            <span className="text-xs text-slate-500 block">Valor por cota</span>
                            <span className="text-xl font-black text-emerald-400">R$ {rifaSelecionada.preco_cota.toFixed(2)}</span>
                          </div>
                          <div className="border-l border-slate-800 pl-4">
                            <span className="text-xs text-slate-500 block">Total de Cotas</span>
                            <span className="text-lg font-bold text-slate-200">{rifaSelecionada.total_cotas} Números</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6 bg-slate-950 p-4 rounded-2xl border border-slate-800/60">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Progresso da Venda</span>
                        <span className="text-emerald-400">{progresso}% Vendido ({totalPagos + totalReservados}/{rifaSelecionada.total_cotas})</span>
                      </div>
                      <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-lg shadow-emerald-500/50"
                          style={{ width: `${progresso}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-xs font-semibold text-slate-400 block mb-2">⚡ Compra Rápida de Cotas:</span>
                      <div className="flex flex-wrap gap-2">
                        {[5, 10, 20, 50].map((qtd) => (
                          <button
                            key={qtd}
                            onClick={() => adicionarLote(qtd)}
                            className="bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 font-bold px-4 py-2 rounded-xl text-xs transition border border-slate-700/80 shadow"
                          >
                            +{qtd} Cotas
                          </button>
                        ))}
                        {cotasSelecionadas.length > 0 && (
                          <button
                            onClick={() => setCotasSelecionadas([])}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold transition border border-red-500/20 ml-auto"
                          >
                            Limpar Seleção ({cotasSelecionadas.length})
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-300">Escolha seus números da sorte:</span>
                        <div className="flex items-center space-x-4 text-xs font-medium">
                          <div className="flex items-center space-x-1.5"><div className="w-3 h-3 bg-slate-900 border border-slate-800 rounded-sm"></div><span className="text-slate-400">Livre</span></div>
                          <div className="flex items-center space-x-1.5"><div className="w-3 h-3 bg-amber-500 rounded-sm"></div><span className="text-slate-400">Reservado</span></div>
                          <div className="flex items-center space-x-1.5"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div><span className="text-slate-400">Pago</span></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-[380px] overflow-y-auto p-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                        {Array.from({ length: rifaSelecionada.total_cotas }).map((_, index) => {
                          const num = index;
                          const bilhete = bilhetes.find(b => b.numero === num);
                          let bg = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-600';
                          
                          if (bilhete?.status === 'pago') bg = 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/20';
                          else if (bilhete?.status === 'reservado') bg = 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-md';
                          else if (cotasSelecionadas.includes(num)) bg = 'bg-gradient-to-tr from-blue-600 to-indigo-500 border-white text-white font-black scale-105 shadow-lg ring-2 ring-blue-400/50';

                          return (
                            <button
                              key={num}
                              disabled={bilhete?.status === 'pago' || bilhete?.status === 'reservado'}
                              onClick={() => selecionarCota(num)}
                              className={`h-11 rounded-xl flex items-center justify-center text-xs font-mono transition-all duration-200 border ${bg}`}
                            >
                              {num.toString().padStart(3, '0')}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {cotasSelecionadas.length > 0 && (
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-500/40 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-emerald-500 p-2.5 rounded-xl text-slate-950 font-bold shadow-lg">
                            <Ticket className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-lg text-white">Finalizar Reserva</h3>
                            <p className="text-xs text-emerald-400 font-semibold">{cotasSelecionadas.length} cota(s) selecionada(s)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Total a Pagar</span>
                          <span className="text-2xl font-black text-emerald-400">R$ {(cotasSelecionadas.length * rifaSelecionada.preco_cota).toFixed(2)}</span>
                        </div>
                      </div>

                      <form onSubmit={realizarReserva} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">Seu Nome Completo</label>
                          <input
                            type="text"
                            placeholder="Ex: João da Silva"
                            value={comprador.nome}
                            onChange={e => setComprador({...comprador, nome: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">WhatsApp com DDD</label>
                          <input
                            type="text"
                            placeholder="Ex: 86999999999"
                            value={comprador.whatsapp}
                            onChange={e => setComprador({...comprador, whatsapp: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">Cupom / Afiliado (Opcional)</label>
                          <select
                            value={comprador.afiliado}
                            onChange={e => setComprador({...comprador, afiliado: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500"
                          >
                            <option value="">Venda Direta</option>
                            {afiliados.map(a => (
                              <option key={a.id} value={a.codigo}>{a.nome} ({a.codigo})</option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="sm:col-span-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 text-base flex items-center justify-center space-x-2"
                        >
                          <span>Gerar Pedido & Reservar Bilhetes</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 h-fit space-y-4 shadow-2xl backdrop-blur">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h3 className="font-extrabold text-base text-white flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <span>Painel de Aprovações</span>
                    </h3>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-bold">{bilhetes.length} pedidos</span>
                  </div>

                  <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                    {bilhetes.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-sm">
                        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        Nenhum bilhete reservado nesta campanha.
                      </div>
                    ) : (
                      bilhetes.map(b => (
                        <div key={b.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition flex items-center justify-between shadow-inner">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-black text-emerald-400 text-base">#{b.numero.toString().padStart(3, '0')}</span>
                              <span className="text-sm font-bold text-white truncate max-w-[120px]">{b.comprador_nome}</span>
                            </div>
                            <span className="text-xs text-slate-400 block mt-0.5">{b.comprador_whatsapp}</span>
                            {b.afiliado_codigo && (
                              <span className="inline-block mt-1 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                                Afiliado: {b.afiliado_codigo}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {b.status === 'reservado' ? (
                              <button 
                                onClick={() => atualizarStatusCota(b.id, 'pago')}
                                className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 p-2.5 rounded-xl transition font-bold shadow"
                                title="Aprovar Pagamento Pix"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => atualizarStatusCota(b.id, 'reservado')}
                                className="bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 p-2.5 rounded-xl transition font-bold shadow"
                                title="Voltar para Reservado"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}

                            <button 
                              onClick={() => enviarWhatsApp(b)}
                              className="bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-slate-950 p-2.5 rounded-xl transition font-bold shadow"
                              title="Enviar Comprovante no WhatsApp"
                            >
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
              <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
                <AlertCircle className="w-14 h-14 text-slate-500 mx-auto mb-4 opacity-60" />
                <h3 className="text-xl font-bold text-white mb-2">Nenhuma rifa cadastrada</h3>
                <p className="text-slate-400 text-sm mb-6">Clique no botão abaixo para criar a sua primeira campanha de sucesso!</p>
                <button 
                  onClick={() => setAba('criar')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-xl transition shadow-lg shadow-emerald-500/20"
                >
                  Criar Minha Primeira Rifa
                </button>
              </div>
            )}
          </div>
        )}

        {aba === 'criar' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="bg-emerald-500 p-3 rounded-2xl text-slate-950">
                <Plus className="w-6 h-6 font-bold" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Criar Nova Campanha</h2>
                <p className="text-xs text-slate-400">Configure os prêmios e o total de números</p>
              </div>
            </div>

            <form onSubmit={criarRifa} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Título do Prêmio</label>
                <input
                  type="text"
                  placeholder="Ex: iPhone 15 Pro Max ou R$ 5.000 no Pix"
                  value={novaRifa.titulo}
                  onChange={e => setNovaRifa({...novaRifa, titulo: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Descrição Detalhada</label>
                <textarea
                  placeholder="Regulamento, data do sorteio, etc..."
                  value={novaRifa.descricao}
                  onChange={e => setNovaRifa({...novaRifa, descricao: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white outline-none focus:border-emerald-500 h-28 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Preço por Cota (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="10.00"
                    value={novaRifa.preco_cota}
                    onChange={e => setNovaRifa({...novaRifa, preco_cota: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Total de Cotas</label>
                  <select
                    value={novaRifa.total_cotas}
                    onChange={e => setNovaRifa({...novaRifa, total_cotas: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white outline-none focus:border-emerald-500"
                  >
                    <option value={100}>100 Cotas (00 a 99)</option>
                    <option value={1000}>1.000 Cotas (000 a 999)</option>
                    <option value={10000}>10.000 Cotas (0000 a 9999)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Link da Imagem do Prêmio (URL)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={novaRifa.imagem_url}
                  onChange={e => setNovaRifa({...novaRifa, imagem_url: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black py-4 rounded-2xl transition shadow-xl shadow-emerald-500/20 text-base mt-2"
              >
                Cadastrar e Publicar Campanha
              </button>
            </form>
          </div>
        )}

        {aba === 'afiliados' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-lg text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Novo Afiliado</span>
              </h3>
              <form onSubmit={criarAfiliado} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome do Afiliado"
                  value={novoAfiliado.nome}
                  onChange={e => setNovoAfiliado({...novoAfiliado, nome: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Código Ex: pedro10"
                  value={novoAfiliado.codigo}
                  onChange={e => setNovoAfiliado({...novoAfiliado, codigo: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Comissão (%)"
                  value={novoAfiliado.comissao_porcentagem}
                  onChange={e => setNovoAfiliado({...novoAfiliado, comissao_porcentagem: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Chave Pix para Pagamento"
                  value={novoAfiliado.pix_chave}
                  onChange={e => setNovoAfiliado({...novoAfiliado, pix_chave: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition shadow-lg shadow-emerald-500/20 text-sm"
                >
                  Cadastrar Afiliado
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <h3 className="font-extrabold text-lg text-white mb-4">Afiliados Ativos</h3>
              <div className="space-y-3">
                {afiliados.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhum afiliado cadastrado ainda.</p>
                ) : (
                  afiliados.map(a => (
                    <div key={a.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-inner">
                      <div>
                        <h4 className="font-bold text-white text-base">{a.nome}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Link/Código: <span className="text-emerald-400 font-mono font-bold">?ref={a.codigo}</span> | Comissão: <span className="text-amber-400 font-bold">{a.comissao_porcentagem}%</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Pix: {a.pix_chave || 'Não informada'}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const url = `${window.location.origin}/?ref=${a.codigo}`;
                          navigator.clipboard.writeText(url);
                          alert('Link de afiliado copiado!');
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl transition text-xs font-semibold flex items-center space-x-1.5"
                      >
                        <Share2 className="w-4
