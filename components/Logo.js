import Image from 'next/image';
export default function Logo({ compact=false }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><div className="brand-mark"><Image src="/img/logo.png" alt="HomeFix" width={72} height={72} priority /></div>{!compact && <div><strong>HomeFix</strong><span>Soluciones para tu hogar</span></div>}</div>;
}
