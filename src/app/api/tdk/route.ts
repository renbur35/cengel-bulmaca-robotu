import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://sozluk.gov.tr/gts?ara=${encodeURIComponent(word)}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 86400 } // TDK sonuçlarını 1 gün önbellekte tut
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch from TDK' }, { status: res.status });
    }

    const data = await res.json();
    
    // TDK API kelime bulunamadığında { error: "Sonuç bulunamadı" } şeklinde obje döner
    if (data.error) {
      return NextResponse.json({ meaning: null });
    }

    // Başarılı olduğunda dizi döner
    if (Array.isArray(data) && data.length > 0) {
      const madde = data[0];
      if (madde.anlamlarListe && madde.anlamlarListe.length > 0) {
        return NextResponse.json({ meaning: madde.anlamlarListe[0].anlam });
      }
    }
    
    return NextResponse.json({ meaning: null });
  } catch (error) {
    console.error('TDK API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
