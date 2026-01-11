import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, MapPin, Globe, Heart } from 'lucide-react';

const CataloniaPage: React.FC = () => {
    useEffect(() => {
        document.title = 'What is .cat? - Catalonia';
    }, []);

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a
                        href="/"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Home</span>
                    </a>
                    <span className="font-bold text-lg tracking-tight">.cat</span>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                {/* Abstract Background Elements (Senyera colors: Yellow & Red) */}
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-yellow-300 rounded-full blur-[120px] opacity-20" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-400 rounded-full blur-[120px] opacity-10" />

                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-6">
                            문화 & 도메인
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">.cat</span> 도메인이 뭐에요?
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-10 keep-all">
                            단순한 도메인 그 이상. 카탈루냐 언어와 문화를 위한 디지털 공간입니다.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16 px-6 relative z-10">
                <div className="max-w-4xl mx-auto space-y-24">

                    {/* Introduction */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="grid md:grid-cols-2 gap-12 items-center"
                    >
                        <div className="prose prose-lg text-gray-600 keep-all">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">문화적 정체성</h2>
                            <p>
                                <strong>.cat</strong> 도메인은 특정 언어와 문화 공동체인 '카탈루냐어 사용자'를 위해 예약된 최초의 최상위 도메인(TLD)입니다.
                            </p>
                            <p>
                                한국(.kr)이나 일본(.jp) 같은 국가 코드가 아닙니다. 전 세계 어디에 있든 <em>카탈루냐 언어와 문화</em>를 공유하는 사람들을 위한 도메인입니다.
                            </p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform -rotate-3">
                                <Globe className="text-white w-12 h-12" />
                            </div>
                            <div className="font-bold text-2xl text-gray-900 mb-2">1,100만 명+</div>
                            <p className="text-gray-500">전 세계 카탈루냐어 사용자</p>
                        </div>
                    </motion.div>

                    {/* About Catalonia */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-[40px] p-8 md:p-16 shadow-2xl border border-gray-100"
                    >
                        <div className="max-w-3xl mx-auto text-center">
                            <span className="flex items-center justify-center gap-2 text-red-500 font-bold mb-4">
                                <MapPin size={20} />
                                카탈루냐에 대하여
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
                                카탈루냐 (Catalunya)
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed mb-8 keep-all">
                                스페인 북동부에 위치한 카탈루냐는 독자적인 역사, 문화, 언어를 가진 지역입니다. 수도인 바르셀로나는 예술, 건축, 그리고 활기찬 라이프스타일로 전 세계적인 사랑을 받고 있어요.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <span className="px-4 py-2 bg-gray-50 rounded-xl text-gray-700 font-medium border border-gray-100">바르셀로나 ✨</span>
                                <span className="px-4 py-2 bg-gray-50 rounded-xl text-gray-700 font-medium border border-gray-100">가우디 🏗️</span>
                                <span className="px-4 py-2 bg-gray-50 rounded-xl text-gray-700 font-medium border border-gray-100">지중해 🌊</span>
                                <span className="px-4 py-2 bg-gray-50 rounded-xl text-gray-700 font-medium border border-gray-100">인간 탑 쌓기(Castells) 🏰</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Interesting Fact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col md:flex-row gap-8 items-stretch"
                    >
                        <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 text-white flex flex-col justify-center">
                            <Heart className="w-10 h-10 text-red-400 mb-6" />
                            <h3 className="text-2xl font-bold mb-4">왜 .cat 인가요?</h3>
                            <p className="text-gray-300 leading-relaxed keep-all">
                                .cat 도메인을 사용하는 것은 카탈루냐 언어를 지지한다는 선언이자, 당신의 콘텐츠가 카탈루냐 문화권과 관련이 있음을 알리는 배지입니다. 문화적 자부심의 상징이에요.
                            </p>
                        </div>
                        <div className="flex-1 bg-amber-50 rounded-3xl p-10 border border-amber-100 flex flex-col justify-center">
                            <h3 className="text-2xl font-bold text-amber-900 mb-4">알고 계셨나요?</h3>
                            <p className="text-amber-800 leading-relaxed mb-6 keep-all">
                                2005년에 승인된 .cat 도메인은 특정 산업이나 국가가 아닌, '문화 공동체'를 중심으로 만들어진 최초의 후원 최상위 도메인(sponsored TLD) 중 하나랍니다.
                            </p>
                            <a
                                href="https://fundacio.cat/en/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-amber-700 font-bold hover:text-amber-900 transition-colors"
                            >
                                Fundació .cat 방문하기 <ExternalLink size={16} />
                            </a>
                        </div>
                    </motion.div>

                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center text-gray-500 text-sm">
                <p>© {new Date().getFullYear()} mofu.cat. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default CataloniaPage;
