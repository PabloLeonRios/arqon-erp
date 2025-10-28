export default function Home() {
  return (
    <main style={{minHeight: '100vh', display:'grid', placeItems:'center', fontFamily:'system-ui, Inter, Arial'}}>
      <div style={{textAlign:'center'}}>
        <h1 style={{fontSize: 'clamp(28px,4vw,56px)', margin: 0}}>ARQON ERP — Starter OK ✅</h1>
        <p style={{fontSize: 'clamp(16px,2vw,20px)'}}>Deploy de prueba {new Date().toISOString()}</p>
      </div>
    </main>
  );
}
