export interface Photo {
  id: number
  src: string
  alt: string
}

export interface Article {
  id: number
  titleEn: string
  titleAr: string
  excerptEn: string
  excerptAr: string
  image: string
  dateEn: string
  dateAr: string
  url: string
}

export interface Video {
  id: number
  titleEn: string
  titleAr: string
  thumbnail: string
  duration: string
  videoUrl: string
}

export interface PdfDoc {
  id: number
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  pdfUrl: string
  fileSize: string
}

export const photosData: Photo[] = [
  { id: 1,  src: '/images/1.webp',  alt: 'Award ceremony moment 1'  },
  { id: 2,  src: '/images/2.webp',  alt: 'Award ceremony moment 2'  },
  { id: 3,  src: '/images/3.webp',  alt: 'Award ceremony moment 3'  },
  { id: 4,  src: '/images/5.webp',  alt: 'Award ceremony moment 4'  },
  { id: 5,  src: '/images/6.webp',  alt: 'Award ceremony moment 5'  },
  { id: 6,  src: '/images/11.webp',  alt: 'Award ceremony moment 6'  },
  { id: 7,  src: '/images/12.webp',  alt: 'Award ceremony moment 7'  },
  { id: 8,  src: '/images/13.webp', alt: 'Award ceremony moment 8'  },
  { id: 9,  src: '/images/14.webp', alt: 'Award ceremony moment 9'  },
  { id: 10, src: '/images/15.webp',  alt: 'Award ceremony moment 10' },
  { id: 11, src: '/images/16.webp',  alt: 'Award ceremony moment 11' },
  { id: 12, src: '/images/17.webp', alt: 'Award ceremony moment 12' },
]

export const articlesData: Article[] = [
  {
    id: 1,
    titleEn: 'The First Cycle of the Award Concludes with Honoring Five Winners',
    titleAr: 'ختام الدورة الأولى للجائزة بتكريم خمسة فائزين',
    excerptEn: 'The Dr. Ayed Al-Qarni Excellence Award concluded its inaugural cycle with a distinguished ceremony honoring five outstanding winners from the Balqarn community.',
    excerptAr: 'اختتمت جائزة الدكتور عائض القرني للتميز دورتها الأولى بحفل مميز تم فيه تكريم خمسة فائزين متميزين من أبناء وبنات بلقرن.',
    image: '/images/16.webp',
    dateEn: 'October 10, 2025',
    dateAr: '10 أكتوبر 2025م',
    url: 'https://aqeaw.com/ar/pages/article-page',
  },
  {
    id: 2,
    titleEn: 'Award Ceremony Highlights and Key Moments',
    titleAr: 'أبرز لحظات حفل توزيع الجوائز',
    excerptEn: 'A recap of the most memorable moments from the award ceremony, featuring speeches, recognitions, and celebrations of excellence.',
    excerptAr: 'استعراض لأبرز اللحظات من حفل توزيع الجوائز، متضمناً الكلمات والتكريمات والاحتفالات بالتميز.',
    image: '/images/article2.webp',
    dateEn: 'October 8, 2025',
    dateAr: '8 أكتوبر 2025م',
    url: 'https://aqeaw.com/ar/pages/article2',
  },
  {
    id: 3,
    titleEn: 'Winners Share Their Stories of Excellence',
    titleAr: 'الفائزون يشاركون قصصهم في التميز',
    excerptEn: 'The award winners share inspiring stories about their journeys, achievements, and vision for contributing to their community.',
    excerptAr: 'يشارك الفائزون بالجائزة قصصاً ملهمة عن مسيرتهم وإنجازاتهم ورؤيتهم للمساهمة في مجتمعهم.',
    image: '/images/article3.webp',
    dateEn: 'October 12, 2025',
    dateAr: '12 أكتوبر 2025م',
    url: 'https://aqeaw.com/ar/pages/article-3',
  },
  {
    id: 4,
    titleEn: 'A Look Inside the Award Evaluation Process',
    titleAr: 'نظرة داخلية على عملية تقييم الجائزة',
    excerptEn: 'An in-depth look at how the judging committee evaluates nominations, ensuring fairness, transparency and adherence to award standards.',
    excerptAr: 'نظرة معمّقة على كيفية تقييم لجنة التحكيم للترشيحات، وضمان النزاهة والشفافية والالتزام بمعايير الجائزة.',
    image: '/images/article4.webp',
    dateEn: 'October 5, 2025',
    dateAr: '5 أكتوبر 2025م',
    url: 'https://aqeaw.com/ar/pages/article-4',
  },
  {
    id: 5,
    titleEn: 'Dr. Ayed Alqarni Speaks on the Award Vision',
    titleAr: 'الدكتور عائض القرني يتحدث عن رؤية الجائزة',
    excerptEn: 'Dr. Ayed Alqarni shares the vision behind establishing the award and his hopes for inspiring future generations from Balqarn.',
    excerptAr: 'يشارك الدكتور عائض القرني الرؤية وراء تأسيس الجائزة وآماله في إلهام الأجيال القادمة من بلقرن.',
    image: '/images/article5.png',
    dateEn: 'August 20, 2025',
    dateAr: '20 أغسطس 2025م',
    url: 'https://aqeaw.com/ar/pages/article-5',
  },
]

export const videosData: Video[] = [
  {
    id: 1,
    titleEn: 'Award Ceremony — Full Recording',
    titleAr: 'حفل توزيع الجوائز — التسجيل الكامل',
    thumbnail: '/images/16.webp',
    duration: '1:55:45',
    videoUrl: 'https://www.youtube.com/embed/pF4_txrvlHQ',
  },
  {
    id: 2,
    titleEn: 'First Council Meeting — Full Recording',
    titleAr: 'اجتماع المجلس الأول — التسجيل الكامل',
    thumbnail: '/images/article2.webp',
    duration: '39:26',
    videoUrl: 'https://www.youtube.com/embed/P6OcNLjsmdE',
  },
]

export const pdfsData: PdfDoc[] = [
  {
    id: 1,
    titleEn: 'Award Regulations Document',
    titleAr: 'وثيقة لائحة الجائزة',
    descriptionEn: 'The official regulations document for the Dr. Ayed Al-Qarni Excellence Award, covering all rules, criteria, and procedures.',
    descriptionAr: 'الوثيقة الرسمية للائحة جائزة الدكتور عائض القرني للتميز، تغطي جميع القواعد والمعايير والإجراءات.',
    pdfUrl: '/images/ARD.pdf',
    fileSize: '302.01 KB',
  },
]