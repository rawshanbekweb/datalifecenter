import React from 'react';

/**
 * Schema.org strukturali ma'lumoti (JSON-LD).
 *
 * Qidiruv tizimlari sahifaning NIMA ekanini shundan aniq biladi: kurs bo'lsa
 * narx/davomiylik/reyting, maqola bo'lsa muallif/sana chiqishi mumkin.
 * Meta teglardan farqli o'laroq bu <head>ga ko'chirilishi shart emas —
 * Google hujjatning istalgan joyidan o'qiydi.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }): React.ReactElement {
  // "<" ni ekranlash SHART: kurs nomida tasodifan </script> uchrasa, u
  // skriptni yopib, qolgan matn sahifa kodiga aylanib ketardi.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
