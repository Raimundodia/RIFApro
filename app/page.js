'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Plus, Ticket, Users, Trophy, DollarSign, CheckCircle, 
  Trash2, Send, Shuffle, Sparkles, AlertCircle, RefreshCw 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Home() {
  const [aba, setAba] = useState('rifas');
  const [rifas, setRifas] = useState([]);
  const [rifaSelecionada, setRifaSelecionada] = useState(null);
  const [bilhetes, setBilhetes] = useState([]);
  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(false);

  // Formulário Nova Rifa
  const [novaRifa, setNovaRifa] = useState({
    titulo: '',
    descricao: '',
    preco_cota: '',
    total_cotas: 100,
    imagem_url: ''
  });

  // Formulário Novo Afiliado
  const [novoAfiliado, setNovoAfiliado] = useState({
    nome: '',
    codigo: '',
    comissao_porcentagem: 10,
    pix_chave: ''
  });

  // Formulário Compra
  const [cotasSelecionadas, setCotasSelecionadas] = useState([]);
  const [comprador, setComprador] = useState({ nome: '', whatsapp: '', afiliado: '' });

  // Sorteio
  const [numFederal, setNumFederal] = useState('');
  const [ganhadorFederal, setGanhadorFederal] = useState(null);
  const [ganhadorRoleta, setGanhadorRoleta] = useState(null);
  const [roletando, setRoletando] = useState(false);

  // Carregar Rifas ao iniciar
  useEffect(() => {
    carregarRifas();
    carregarAfiliados();
  }, []);

  // Carregar Bilhetes ao selecionar Rifa
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
      imagem_url: novaRifa.imagem_url || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800'
    }]).select();

    if (error) {
      alert('Erro ao criar rifa: ' + error.message);
    } else {
      alert('Rifa criada com sucesso!');
      setNovaRifa({ titulo: '', descricao: '', preco_cota: '', total_cotas: 100, imagem_url: '' });
      carregarRifas();
      if (data && data[0]) setRifaSelecionada(data[0]);
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
      alert('Rifa apagada!');
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
      alert('Afiliado cadastrado!');
      setNovoAfiliado({ nome: '', codigo: '', comissao_porcentagem: 10, pix_chave: '' });
      carregarAfiliados();
    }
  };

  const selecionarCota = (num) => {
    if (cotasSelecionadas.includes(num)) {
      setCotasSelecionadas(cotasSelecionadas.filter(n => n !== num));
    } else {
      setCotasSelecionadas([...cotasSelecionadas, num]);
    }
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
      alert('Erro ao reservar cotas (alguma pode já ter sido reservada): ' + error.message);
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
    if (!error) {
      carregarBilhetes(rifaSelecionada.id);
    }
  };

  const enviarWhatsApp = (bilhete) => {
    const texto = `Olá *${bilhete.comprador_nome}*!\n\nConfirmação da Rifa: *${rifaSelecionada.titulo}*\nNúmero(s): *#${bilhete.numero}*\nStatus: *${bilhete.status.toUpperCase()}*\n\nObrigado por participar!`;
    const numLimpo = bilhete.comprador_whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/55${numLimpo}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // Sorteios
  const calcularFederal = () => {
    if (!numFederal || !rifaSelecionada) return;
    const num = parseInt(numFederal);
    const numeroGanhador = num % rifaSelecionada.total_cotas;
    const bilheteGanhador = bilhetes.find(b => b.numero === numeroGanhador && b.status === 'pago');

    setGanhadorFederal({
      numero: numeroGanhador,
      comprador: bilheteGanhador ? bilheteGanhador.comprador_nome : 'Cota não paga/livre',
      whatsapp: bilheteGanhador ? bilheteGanhador.comprador_whatsapp : '-'
    });
    confetti();
  };

  const rodarRoleta = () => {
    const pagos = bilhetes.filter(b => b.status === 'pago');
    if (pagos.length === 0) return alert('Nenhum bilhete pago nesta rifa para sortear!');

    setRoletando(true);
    let contador = 0;
    const interval = setInterval(() => {
      const temp = pagos[Math.floor(Math.random() * pagos.length)];
      setGanhadorRoleta(temp);
      contador++;

      if (contador > 25) {
        clearInterval(interval);
        setRoletando(false);
        confetti();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2 rounded-xl text-slate-950">
              <Ticket className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">RifaPro Master</span>
          </div>

          {/* Navegação */}
          <nav className="flex space-x-1 bg-slate-800/60 p-1 rounded-xl">
            {[
              { id: 'rifas', label: 'Rifas & Vendas', icon: Ticket },
              { id: 'criar', label: 'Nova Rifa', icon: Plus },
              { id: 'afiliados', label: 'Afiliados', icon: Users },
              { id: 'sorteio', label: 'Sorteios', icon: Trophy }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAba(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    aba === tab.id ? 'bg-emerald-500 text-slate-950 font-semibold shadow' : 'text-slate-400 hover:text-white'
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

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 pt-8">

        {/* 1. SELEÇÃO E VISUALIZAÇÃO DE RIFAS */}
        {aba === 'rifas' && (
          <div className="space-y-8">
            {/* Seletor de Rifa Ativa */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <span className="text-slate-400 font-medium">Selecione a Rifa:</span>
                <select 
                  value={rifaSelecionada?.id || ''} 
                  onChange={(e) => setRifaSelecionada(rifas.find(r => r.id === e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {rifas.map(r => (
                    <option key={r.id} value={r.id}>{r.titulo} (R$ {r.preco_cota.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              {rifaSelecionada && (
                <button 
                  onClick={() => deletarRifa(rifaSelecionada.id)}
                  className="flex items-center space-x-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-xl transition text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Apagar Rifa</span>
                </button>
              )}
            </div>

            {rifaSelecionada ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Painel do Grid de Cotas */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{rifaSelecionada.titulo}</h2>
                        <p className="text-slate-400 text-sm mt-1">{rifaSelecionada.descricao}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Preço por cota</span>
                        <span className="text-xl font-bold text-emerald-400">R$ {rifaSelecionada.preco_cota.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Grade de Números */}
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-[400px] overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800/80">
                      {Array.from({ length: rifaSelecionada.total_cotas }).map((_, index) => {
                        const num = index;
                        const bilhete = bilhetes.find(b => b.numero === num);
                        let bg = 'bg-slate-800 text-slate-300 hover:bg-slate-700';
                        
                        if (bilhete?.status === 'pago') bg = 'bg-emerald-500 text-slate-950 font-bold';
                        else if (bilhete?.status === 'reservado') bg = 'bg-amber-500 text-slate-950 font-bold';
                        else if (cotasSelecionadas.includes(num)) bg = 'bg-blue-500 text-white font-bold ring-2 ring-white';

                        return (
                          <button
                            key={num}
                            disabled={bilhete?.status === 'pago' || bilhete?.status === 'reservado'}
                            onClick={() => selecionarCota(num)}
                            className={`h-10 rounded-lg flex items-center justify-center text-xs font-mono transition ${bg}`}
                          >
                            {num.toString().padStart(3, '0')}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-slate-400">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-slate-800 rounded"></div>
                        <span>Livre</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-amber-500 rounded"></div>
                        <span>Reservado</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                        <span>Pago</span>
                      </div>
                    </div>
                  </div>

                  {/* Formulário de Compra */}
                  {cotasSelecionadas.length > 0 && (
                    <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-2xl space-y-4">
                      <h3 className="font-bold text-lg text-white flex items-center space-x-2">
                        <Ticket className="w-5 h-5 text-emerald-400" />
                        <span>Reservar Cotas Selecionadas ({cotasSelecionadas.length})</span>
                      </h3>
                      <form onSubmit={realizarReserva} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="Nome do Comprador"
                          value={comprador.nome}
                          onChange={e => setComprador({...comprador, nome: e.target.value})}
                          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                        />
                        <input
                          type="text"
                          placeholder="WhatsApp (ex: 86999999999)"
                          value={comprador.whatsapp}
                          onChange={e => setComprador({...comprador, whatsapp: e.target.value})}
                          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                        />
                        <select
                          value={comprador.afiliado}
                          onChange={e => setComprador({...comprador, afiliado: e.target.value})}
                          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                        >
                          <option value="">Venda Direta (Sem Afiliado)</option>
                          {afiliados.map(a => (
                            <option key={a.id} value={a.codigo}>{a.nome} ({a.codigo})</option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={loading}
                          className="sm:col-span-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition"
                        >
                          Confirmar Reserva (Total: R$ {(cotasSelecionadas.length * rifaSelecionada.preco_cota).toFixed(2)})
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Lista de Reservas & Gestão de Pagamento */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-4">
                  <h3 className="font-bold text-lg text-white">Gerenciar Reservas & Pagamentos</h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {bilhetes.length === 0 ? (
                      <p className="text-slate-500 text-sm">Nenhum bilhete reservado ainda.</p>
                    ) : (
                      bilhetes.map(b => (
                        <div key={b.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-emerald-400">#{b.numero.toString().padStart(3, '0')}</span>
                              <span className="text-sm font-semibold text-white">{b.comprador_nome}</span>
                            </div>
                            <span className="text-xs text-slate-400 block">{b.comprador_whatsapp}</span>
                            {b.afiliado_codigo && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                                Afiliado: {b.afiliado_codigo}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1">
                            {b.status === 'reservado' ? (
                              <button 
                                onClick={() => atualizarStatusCota(b.id, 'pago')}
                                className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 p-2 rounded-lg transition"
                                title="Aprovar Pagamento"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => atualizarStatusCota(b.id, 'reservado')}
                                className="bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 p-2 rounded-lg transition"
                                title="Mudar para Reservado"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}

                            <button 
                              onClick={() => enviarWhatsApp(b)}
                              className="bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-slate-950 p-2 rounded-lg transition"
                              title="Enviar WhatsApp"
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
              <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
                <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Nenhuma rifa cadastrada. Clique em "Nova Rifa" para criar a primeira!</p>
              </div>
            )}
          </div>
        )}

        {/* 2. CADASTRAR NOVA RIFA */}
        {aba === 'criar' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Plus className="w-6 h-6 text-emerald-400" />
              <span>Criar Nova Rifa</span>
            </h2>

            <form onSubmit={criarRifa} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400 block mb-1">Título da Rifa</label>
                <input
                  type="text"
                  placeholder="Ex: iPhone 15 Pro Max ou R$ 5.000 no Pix"
                  value={novaRifa.titulo}
                  onChange={e => setNovaRifa({...novaRifa, titulo: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400 block mb-1">Descrição</label>
                <textarea
                  placeholder="Detalhes do prêmio, data do sorteio..."
                  value={novaRifa.descricao}
                  onChange={e => setNovaRifa({...novaRifa, descricao: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400 block mb-1">Preço por Cota (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="10.00"
                    value={novaRifa.preco_cota}
                    onChange={e => setNovaRifa({...novaRifa, preco_cota: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-400 block mb-1">Quantidade de Cotas</label>
                  <select
                    value={novaRifa.total_cotas}
                    onChange={e => setNovaRifa({...novaRifa, total_cotas: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                  >
                    <option value={100}>100 Cotas (00 a 99)</option>
                    <option value={1000}>1.000 Cotas (000 a 999)</option>
                    <option value={10000}>10.000 Cotas (0000 a 9999)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400 block mb-1">URL da Imagem (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={novaRifa.imagem_url}
                  onChange={e => setNovaRifa({...novaRifa, imagem_url: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition mt-4"
              >
                Cadastrar e Publicar Rifa
              </button>
            </form>
          </div>
        )}

        {/* 3. GERENCIAR AFILIADOS */}
        {aba === 'afiliados' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-4">
              <h3 className="font-bold text-lg text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>Novo Afiliado</span>
              </h3>
              <form onSubmit={criarAfiliado} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome do Afiliado"
                  value={novoAfiliado.nome}
                  onChange={e => setNovoAfiliado({...novoAfiliado, nome: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Código Ex: pedro10"
                  value={novoAfiliado.codigo}
                  onChange={e => setNovoAfiliado({...novoAfiliado, codigo: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Comissão (%)"
                  value={novoAfiliado.comissao_porcentagem}
                  onChange={e => setNovoAfiliado({...novoAfiliado, comissao_porcentagem: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Chave Pix"
                  value={novoAfiliado.pix_chave}
                  onChange={e => setNovoAfiliado({...novoAfiliado, pix_chave: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition"
                >
                  Cadastrar Afiliado
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-lg text-white mb-4">Afiliados Cadastrados</h3>
              <div className="space-y-3">
                {afiliados.map(a => (
                  <div key={a.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">{a.nome}</h4>
                      <p className="text-xs text-slate-400">Código: <span className="text-emerald-400 font-mono">{a.codigo}</span> | Comissão: {a.comissao_porcentagem}%</p>
                      <p className="text-xs text-slate-500">Pix: {a.pix_chave || 'Não cadastrado'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. SORTEIOS */}
        {aba === 'sorteio' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sorteio Loteria Federal */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg text-white flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Calculadora Loteria Federal</span>
              </h3>
              <p className="text-sm text-slate-400">
                Insira o 1º Prêmio da Caixa Econômica Federal. O sistema calculará o número vencedor correspondente ao total de cotas.
              </p>

              <input
                type="number"
                placeholder="Ex: 085432"
                value={numFederal}
                onChange={e => setNumFederal(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-mono outline-none focus:border-amber-400"
              />

              <button
                onClick={calcularFederal}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition"
              >
                Calcular Ganhador
              </button>

              {ganhadorFederal && (
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 text-center space-y-1">
                  <span className="text-xs text-amber-400 uppercase tracking-wider block font-bold">Número Sorteado</span>
                  <span className="text-3xl font-mono font-bold text-white">#{ganhadorFederal.numero.toString().padStart(3, '0')}</span>
                  <p className="text-sm text-slate-300">Ganhador: <span className="font-bold text-emerald-400">{ganhadorFederal.comprador}</span></p>
                </div>
              )}
            </div>

            {/* Roleta Aleatória ao Vivo */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-lg text-white flex items-center space-x-2">
                <Shuffle className="w-5 h-5 text-emerald-400" />
                <span>Roleta Eletrônica ao Vivo</span>
              </h3>
              <p className="text-sm text-slate-400">
                Sorteie aleatoriamente apenas entre as cotas com pagamento **PAGO** confirmado.
              </p>

              <button
                onClick={rodarRoleta}
                disabled={roletando}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>{roletando ? 'Sorteando...' : 'Girar Roleta ao Vivo'}</span>
              </button>

              {ganhadorRoleta && (
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 text-center space-y-1">
                  <span className="text-xs text-emerald-400 uppercase tracking-wider block font-bold">Número Ganhador</span>
                  <span className="text-4xl font-mono font-bold text-emerald-400">#{ganhadorRoleta.numero.toString().padStart(3, '0')}</span>
                  <p className="text-lg text-white font-bold">{ganhadorRoleta.comprador_nome}</p>
                  <p className="text-sm text-slate-400">{ganhadorRoleta.comprador_whatsapp}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
