'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Plus, Ticket, Users, Trophy, DollarSign, CheckCircle, 
  Trash2, Send, Shuffle, Sparkles, AlertCircle, RefreshCw, 
  ShieldCheck, Share2, Flame, Award, ArrowRight
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
      alert('Erro ao reservar cotas (alguma pode já ter sido escolhida): ' + error.message);
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
    if (!error) {
      carregarBilhetes(rifaSelecionada.id);
    }
  };

  const enviarWhatsApp = (bilhete) => {
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

  // Estatísticas da rifa ativa
  const totalPagos = bilhetes.filter(b => b.status === 'pago').length;
  const totalReservados = bilhetes.filter(b => b.status === 'reservado').length;
  const progresso = rifaSelecionada ? Math.round(((totalPagos + totalReservados) / rifaSelecionada.total_cotas) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 selection:bg-emerald-500 selection:text-slate-950 font-sans">
      
      {/* Top Banner / Header Profissional */}
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

          {/* Navegação Moderna */}
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
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl
