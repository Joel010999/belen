"use client";

import React, { useState } from "react";
import {
  Check,
  Star,
  ArrowRight,
  MessageCircle,
  HelpCircle,
  Shield,
  Award,
  Users,
  Clock,
  ThumbsUp,
  Menu,
  X
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased scroll-smooth">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {"Spa Sentidos"}
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#servicios" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Servicios</a>
              <a href="#beneficios" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Beneficios</a>
              <a href="#proceso" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Cómo Funciona</a>
              <a href="#testimonios" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Testimonios</a>
              <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Preguntas Frecuentes</a>
            </div>

            <div className="hidden md:flex items-center">
              <a
                href="https://wa.me/5493512345678?text=Hola!%20Vengo%20de%20la%20landing%20de%20Spa%20Sentidos%20y%20me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n%20y%20una%20cotizaci%C3%B3n%20sobre%3A%20Masajes%20descontracturantes%2C%20tratamientos%20faciales%2C%20masoterapia."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-sm font-semibold rounded-full text-white bg-emerald-500 hover:bg-emerald-600 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 space-x-2"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>{"Consultar por WhatsApp"}</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-slate-900 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="h-6 h-6" /> : <Menu className="h-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-6 space-y-3 bg-white border-b border-slate-100 shadow-lg animate-fadeIn">
            <a
              href="#servicios"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            >
              Servicios
            </a>
            <a
              href="#beneficios"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            >
              Beneficios
            </a>
            <a
              href="#proceso"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            >
              Cómo Funciona
            </a>
            <a
              href="#testimonios"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            >
              Testimonios
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            >
              Preguntas Frecuentes
            </a>
            <div className="pt-2">
              <a
                href="https://wa.me/5493512345678?text=Hola!%20Vengo%20de%20la%20landing%20de%20Spa%20Sentidos%20y%20me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n%20y%20una%20cotizaci%C3%B3n%20sobre%3A%20Masajes%20descontracturantes%2C%20tratamientos%20faciales%2C%20masoterapia."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-full text-white bg-emerald-500 hover:bg-emerald-600 font-semibold shadow-md space-x-2 text-center"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>{"Consultar por WhatsApp"}</span>
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/40 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Content Column */}
            <div className="lg:col-span-7 text-center lg:text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100/80 rounded-full px-4 py-1.5 mb-6">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-semibold text-indigo-900 tracking-wide uppercase">
                  Líder en Calidad y Confianza
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {"Llevamos tus necesidades de Masajes descontracturantes, tratamientos faciales, masoterapia al siguiente nivel"}
              </h1>
              
              <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {"Descubre por qué cientos de clientes confían en Spa Sentidos para resolver sus problemas de forma rápida, profesional y con la mejor atención."}
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                <a
                  href="https://wa.me/5493512345678?text=Hola!%20Vengo%20de%20la%20landing%20de%20Spa%20Sentidos%20y%20me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n%20y%20una%20cotizaci%C3%B3n%20sobre%3A%20Masajes%20descontracturantes%2C%20tratamientos%20faciales%2C%20masoterapia."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-full text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg hover:shadow-emerald-500/20 hover:scale-102 transition-all duration-300 space-x-2"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>{"Consultar por WhatsApp"}</span>
                </a>
                <a
                  href="#servicios"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-full text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <span>{"Ver servicios"}</span>
                </a>
              </div>

              {/* Floating Social Proof */}
              <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-slate-500">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                  ))}
                  <span className="font-bold text-slate-800 ml-1">5.0/5</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">100% de Clientes Satisfechos</span>
                </div>
              </div>
            </div>

            {/* Visual Column */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-40 mix-blend-multiply filter pointer-events-none" />
                <div className="absolute top-1/3 right-1/4 w-60 h-60 bg-blue-200 rounded-full blur-3xl opacity-40 mix-blend-multiply filter pointer-events-none" />
                
                <div className="relative rounded-3xl bg-gradient-to-tr from-slate-900 to-indigo-950 p-8 text-white shadow-2xl border border-slate-800/80 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Decorative Elements */}
                  <div className="flex items-center space-x-2 mb-8">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>

                  <div className="space-y-6">
                    <div className="inline-flex items-center px-3 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
                      {"Tono Profesional, buscando generar empatía y profesionalismo de forma simultánea."}
                    </div>
                    
                    <p className="text-2xl font-bold leading-snug">
                      {"Soluciones profesionales en Masajes descontracturantes, tratamientos faciales, masoterapia diseñadas a tu medida, garantizando resultados y tranquilidad."}
                    </p>

                    <div className="pt-4 border-t border-slate-800/80 space-y-3">
                      <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Enfoque Recomendado:</p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {"Posicionar a Spa Sentidos como el líder indiscutido en Profesional independiente, comunicando con un tono Profesional y apuntando a clientes exigentes."}
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-xs text-slate-400">
                        <span className="font-semibold text-white">Sugerencia Visual:</span> {"Estilo visual Sofisticado, Limpio y Altamente Corporativo, transmitiendo los valores del tono Profesional."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problema Section */}
      <section className="py-20 lg:py-32 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-red-800 uppercase tracking-wider">El Problema</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {"¿Cansado de lidiar con problemas en Masajes descontracturantes, tratamientos faciales, masoterapia?"}
          </h2>
          
          <p className="mt-6 text-lg text-slate-600 leading-relaxed">
            {"Sabemos lo frustrante que es contratar un servicio y encontrarse con demoras, falta de comunicación o resultados mediocres. En Spa Sentidos creamos una experiencia totalmente distinta, enfocada en tu tranquilidad."}
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {content.landing.problema.dolores.map((dolor, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
                <div className="pl-2">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <span className="text-sm font-bold text-red-600">!</span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-slate-800 leading-snug">
                    {dolor}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Servicios Section */}
      <section id="servicios" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
              <Award className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Nuestra Solución</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Nuestros Servicios Profesionales
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Soluciones estructuradas y pensadas específicamente para lograr los mejores resultados para tu negocio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.landing.servicios.map((servicio, index) => (
              <div key={index} className="bg-slate-50 hover:bg-white rounded-3xl p-8 border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between h-full">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 flex items-center justify-center mb-6 transition-all duration-300">
                    <Check className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{servicio.nombre}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{servicio.descripcion}</p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200/50">
                  <a
                    href="https://wa.me/5493512345678?text=Hola!%20Vengo%20de%20la%20landing%20de%20Spa%20Sentidos%20y%20me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n%20y%20una%20cotizaci%C3%B3n%20sobre%3A%20Masajes%20descontracturantes%2C%20tratamientos%20faciales%2C%20masoterapia."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-700 space-x-1"
                  >
                    <span>Quiero contratar</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios Section */}
      <section id="beneficios" className="py-20 lg:py-32 bg-slate-50 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              ¿Por qué elegirnos a nosotros?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Descubre los beneficios inmediatos que tendrás al confiar tu proyecto en nuestras manos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.landing.beneficios.map((beneficio, index) => (
              <div key={index} className="bg-white rounded-3xl p-8 border border-slate-200/50 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                  <ThumbsUp className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{beneficio.titulo}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{beneficio.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciales Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
                <Award className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Lo que nos hace únicos</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Nuestros Valores Diferenciales
              </h2>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                No somos una empresa más del mercado. Nos esforzamos diariamente para ofrecer ventajas competitivas reales que marquen la diferencia para ti.
              </p>

              <div className="mt-10 space-y-4">
                {content.landing.diferenciales.map((diferencial, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-950">{diferencial.titulo}</h4>
                      <p className="text-slate-600 text-sm mt-1 leading-relaxed">{diferencial.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <h3 className="text-2xl font-bold mb-6">Garantías de Servicio RenderByte</h3>
              <div className="space-y-6 text-sm text-slate-300">
                <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <Shield className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-white">Transparencia de Presupuesto</p>
                    <p className="text-xs text-slate-400 mt-0.5">El valor cotizado es el valor final. Sin recargos imprevistos.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <Clock className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-white">Entrega en Tiempo Acordado</p>
                    <p className="text-xs text-slate-400 mt-0.5">Si nos demoramos, te bonificamos un porcentaje del servicio.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 text-center lg:text-left">
                <a
                  href="https://wa.me/5493512345678?text=Hola!%20Vengo%20de%20la%20landing%20de%20Spa%20Sentidos%20y%20me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n%20y%20una%20cotizaci%C3%B3n%20sobre%3A%20Masajes%20descontracturantes%2C%20tratamientos%20faciales%2C%20masoterapia."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-full text-white bg-emerald-500 hover:bg-emerald-600 font-bold shadow-md transition-colors"
                >
                  Consultar Presupuesto
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proceso Section */}
      <section id="proceso" className="py-20 lg:py-32 bg-slate-50 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Nuestra Metodología</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              ¿Cómo es nuestro proceso de trabajo?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Un camino claro, ordenado y sin complicaciones para dar de alta tu servicio con la mayor rapidez.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {content.landing.proceso.map((paso, index) => (
              <div key={index} className="bg-white rounded-3xl p-8 border border-slate-200/50 shadow-sm relative group h-full">
                <div className="absolute top-0 right-0 p-6 text-6xl font-extrabold text-slate-100 group-hover:text-indigo-50 transition-colors pointer-events-none select-none">
                  0{paso.paso}
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-6">
                  <span className="text-sm font-bold text-indigo-600">Paso {paso.paso}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{paso.titulo}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{paso.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confianza/Testimonios Section */}
      <section id="testimonios" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-100 rounded-full px-4 py-1.5 mb-6">
              <Users className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Clientes Felices</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {"Lo que nuestros clientes dicen sobre Spa Sentidos"}
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {"La satisfacción de quienes ya confiaron en nosotros es nuestra mejor carta de presentación."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {content.landing.confianza.testimoniosSugeridos.map((testimonio, index) => (
              <div key={index} className="bg-slate-50 rounded-3xl p-8 border border-slate-100 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonio.valoracion || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <p className="text-slate-600 italic text-sm sm:text-base leading-relaxed">
                    &ldquo;{testimonio.testimonio}&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-200/50 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {testimonio.autor[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{testimonio.autor}</h4>
                    <p className="text-xs text-slate-500">{testimonio.cargo}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-32 bg-slate-50 border-t border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 mb-6">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Preguntas</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Preguntas Frecuentes
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              ¿Tienes dudas? Aquí te respondemos las consultas más habituales que nos hacen nuestros clientes.
            </p>
          </div>

          <div className="space-y-4">
            {content.landing.faq.map((item, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm transition-all duration-300">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="font-bold text-slate-900 text-sm sm:text-base">{item.pregunta}</span>
                    <span className="ml-4 flex-shrink-0 text-slate-400 group-hover:text-slate-600">
                      {isOpen ? (
                        <span className="text-2xl font-bold leading-none">-</span>
                      ) : (
                        <span className="text-xl font-bold leading-none">+</span>
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100/80 pt-4 animate-slideDown">
                      {item.respuesta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="py-20 lg:py-24 bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {"¿Listo para dar el gran paso con Spa Sentidos?"}
          </h2>
          
          <p className="mt-6 text-lg sm:text-xl text-indigo-200/90 max-w-2xl mx-auto leading-relaxed">
            {"No dejes para mañana lo que podemos solucionar hoy. Hablemos sobre tu proyecto y preparemos una cotización a la medida de tu presupuesto."}
          </p>

          <div className="mt-10">
            <a
              href="https://wa.me/5493512345678?text=Hola!%20Vengo%20de%20la%20landing%20de%20Spa%20Sentidos%20y%20me%20gustar%C3%ADa%20solicitar%20informaci%C3%B3n%20y%20una%20cotizaci%C3%B3n%20sobre%3A%20Masajes%20descontracturantes%2C%20tratamientos%20faciales%2C%20masoterapia."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-full text-white bg-emerald-500 hover:bg-emerald-600 shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-102 space-x-2"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>{"Hablemos por WhatsApp"}</span>
            </a>
          </div>

          <div className="mt-8 flex items-center justify-center space-x-4 text-xs text-slate-400">
            <span>✓ Cotización 100% Gratuita</span>
            <span>•</span>
            <span>✓ Asesoría Personalizada</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-slate-800 pb-8 mb-8 text-center md:text-left">
            <div>
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {"Spa Sentidos"}
              </span>
              <p className="mt-2 text-xs text-slate-500 uppercase tracking-widest font-semibold">
                Desarrollado internamente por RenderByte
              </p>
            </div>
            <div className="flex justify-center md:justify-end space-x-6">
              {project.instagram && (
                <a
                  href="https://instagram.com/spasentidos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} {"Spa Sentidos"}. Todos los derechos reservados.</p>
            <p className="mt-2 sm:mt-0">Powered by RenderByte Landing Generator</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
