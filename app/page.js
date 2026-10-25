'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Plus, Ticket, Users, Trophy, DollarSign, CheckCircle, 
  Trash2, Send, Shuffle, Sparkles, AlertCircle, RefreshCw, 
  Share2, Flame, Upload
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

  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('rifas').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('rifas').getPublicUrl(fileName);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
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
                      navigator.clipboard.writeText(window.location.origin);
                      alert('Link da rifa copiado para divulgação!');
                    }}
                    className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 px-4 py-2.5 rounded-xl transition text-xs font-bold border border-emerald-500/20"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Copiar Link</span>
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

                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-h-[350px] overflow-y-auto p-3 bg-slate-950 rounded-2xl border border-slate-800">
                      {Array.from({ length: rifaSelecionada.total_cotas }).map((_, index) => {
                        const bilhete = bilhetes.find(b => b.numero === index);
                        let bg = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800';
                        if (bilhete?.status === 'pago') bg = 'bg
