import {NextResponse} from 'next/server';
export async function POST(){
 return NextResponse.json({error:'El registro directo de trabajadores fue sustituido por el proceso formal de postulación. Inicia sesión y visita /postularme.'},{status:410});
}
