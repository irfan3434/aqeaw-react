'use client'

import { useState } from 'react'
import { useLanguage } from '../../lib/LanguageContext'
import styles from './AwardSchedule.module.css'

const content = {
  en: {
    title: 'Dr. Ayed Al-Qarni Excellence Award',
    subtitle1: "Tasks and the award's annual periodic calendar for the year 2025",
    subtitle2: 'School holiday dates: 06/26/2025 to 08/24/2025',
    phases: [
      {
        id: 'phase-1',
        header: 'Phase 1: Announcement Phase for the Launch Event of the Prize Entity and Platform, and the Start of Nominations with the Presence of Council Members',
        specialItems: [
          'Preparation for the launch event, invitations to the council and media channels, and preparation of media materials.',
          'Announcing the determination of key dates for the prize, which include the following proposed dates:',
        ],
        discItems: [
          'Prize and platform launch: 09/01/2025',
          'Announcement of the start of accepting nominations: 10/01/2025',
          'Closing of nominations: 10/05/2025',
          'Evaluation and judging period for 45 days starting on: 10/05/2025',
          'Announcement of the winners: 10/07/2025',
          'Announcement of the event date: 10/07/2025',
        ],
        specialItems2: [
          'Introduction of the prize, answering questions from media channels, and facilitating the dissemination of information about the prize and its objectives.',
        ],
      },
      {
        id: 'phase-2',
        header: 'Phase 2: Preparation and Organization Phase Before and During the Launch.',
        specialItems: [
          'Developing the prize website on the internet and enhancing media materials, logos, and promotional content (Abdullah bin Demis Alqarni).',
          'Announcing the prize through various channels (prize platform, social media platforms, email).',
          'Publishing clear, precise, and accessible application requirements based on the award\'s regulations, verified by the committee.',
          'Promoting the award through social media, groups, and email lists.',
          'Preparing and signing a confidentiality agreement through the award\'s platform for all parties involved.',
        ],
        discItems: [],
        specialItems2: [],
      },
      {
        id: 'phase-3',
        header: 'Phase 3: Preparation and Organization Phase After Launch and Up to the Celebration of Winners',
        specialItems: [
          'Distribute tasks to committees or individuals, including guiding nominees to communication channels, receiving their submissions, screening them, and verifying the information.',
          'Monitor the alignment of the prize procedures with what has been outlined in the vision, objectives, regulations, and its executive bylaw, and ensure their application in all procedures.',
          'Prepare the preliminary budget for the prize in this cycle and determine the maximum number of winners (in coordination with the prize secretary, the prize owner, and whoever leads this task).',
          'Call for a meeting in case of updates affecting the applicants or incidents related to submissions, nominations, procedures, or the prize.',
          'Provide clear guidance to applicants on how to submit their video presentations through specific channels for support, avoiding direct communication to maintain fairness.',
          'Remind applicants of submission deadlines.',
          'Respond to inquiries and provide technical support.',
          'Announce the closure and confirm the receipt of submissions.',
          'Archive, record, and analyze applicants\' data and documents, and prepare a report that includes a simplified analysis of the applicants, such as numbers, age, gender, field, and qualifications.',
          'Deliver all prize outputs to the judging committee.',
          'Organizing a major ceremony at the end of August.',
          'Evaluate the outcomes of the first cycle of the prize to address some of its shortcomings in the next cycle.',
          'Prepare a comprehensive file about the prize in general, including details of the first cycle, its activities, topics, outcomes, and celebrations.',
        ],
        discItems: [],
        specialItems2: [],
        noteItem: 'Highlight its impact to create a detailed file worthy of being presented as a gift to some government officials, winners, and interested parties.',
      },
      {
        id: 'phase-4',
        header: 'Phase 4: Evaluation and Judging Phase for Nominees',
        specialItems: [
          'Sorting and classifying applicants by their fields.',
          'Verify the availability of excellence criteria in the nominated works, which may include interviews at a minimum.',
          'Preparing evaluation templates and criteria.',
          'Determining the number of winners, the type of recognition, and the prizes.',
          'Forming committees based on applicant topics and evaluation requirements. Selecting judges accordingly.',
          'Filtering applicants to reach a shortlist not exceeding twice the intended number of winners.',
          'Conducting the final evaluation and naming winners. Submitting final reports to the award\'s secretary and owner.',
        ],
        discItems: [],
        specialItems2: [],
      },
      {
        id: 'phase-5',
        header: 'Phase 5: Announcing the Winners and Celebration/Recognition (August)',
        specialItems: [
          'Assigning this responsibility to Phase B-2, ensuring the celebration aligns with the event\'s importance and goals.',
        ],
        discItems: [],
        specialItems2: [],
      },
      {
        id: 'phase-6',
        header: 'Phase 6: Review and Evaluation of the Current Cycle (September)',
        specialItems: [
          'Forming a dedicated team for this task under the supervision of the Excellence Award Committee.',
          'Developing evaluation forms and surveys.',
          'Engaging teams from phases 2 and 3, consulting the committee, council, award owner, secretary, and the public.',
          'Analyzing results and providing recommendations to the award\'s secretariat.',
          'An invitation to a preparatory meeting for the next session according to a date chosen by the award secretariat.',
        ],
        discItems: [],
        specialItems2: [],
      },
      {
        id: 'phase-7',
        header: 'Phase 7: Open time and internal review October - December (Secretary and award owner)',
        specialItems: [
          'Usually, after the current cycle ends, the prize remains in preparation for the next cycle after two years.',
          'Consultation and coordination continue between the prize owner and the prize secretariat until preparation for the next cycle begins.',
        ],
        discItems: [],
        specialItems2: [],
      },
    ],
  },
  ar: {
    title: 'جائزة الدكتور عائض القرني للتميز',
    subtitle1: 'المهام والتقويم السنوي الدوري الخاص بالجائزة لعام 2025م',
    subtitle2: 'أول دورة للجائزة عام 2025م',
    phases: [
      {
        id: 'phase-1',
        header: '1. مرحلة الإعلان عن حفل تدشين كيان الجائزة ومنصتها وبدء الترشيح بوجود أعضاء المجلس',
        specialItems: [
          'الإعداد لحفل التدشين والدعوة للمجلس وللقنوات الإعلامية وتجهيز المواد الإعلامية.',
          'الإعلان عن تحديد المواعيد المهمة للجائزة وتشمل المواعيد المقترحة التالية:',
        ],
        discItems: [
          'التدشين للجائزة والمنصة : 09/01/2025',
          'إعلان بدء قبول الترشيحات: 10/01/2025',
          'إعلان إغلاق الترشيح: 10/05/2025',
          'التقييم والتحكيم لمدة 45 يوم تبدأ في: 10/05/2025',
          'الإعلان عن الفائزين: 10/07/2025',
          'الإعلان عن موعد الحفل: 10/07/2025',
        ],
        specialItems2: [
          'التعريف بالجائزة والإجابة على أسئلة القنوات الإعلامية وتسهيل وتعزيز نشر خبر الجائزة وأهدافها.',
        ],
      },
      {
        id: 'phase-2',
        header: '2. مرحلة التحضير والإعداد قبل وأثناء التدشين',
        specialItems: [
          'تطوير موقع للجائزة Web Site على الانترنت وتطوير المواد الإعلامية والشعارات والمواد الاعلانية (بروف/عبدالله بن دميس القرني).',
          'الإعلان عن الجائزة عبر القنوات المختلفة (منصة الجائزة، منصات التواصل، البريد الإلكتروني).',
          'نشر شروط واضحة ودقيقة وسهلة للتقديم على الجائزة من واقع اللائحة (تدقق من اللجنة وتكون منشورة على منصة الجائزة).',
          'الترويج عبر وسائل التواصل الاجتماعي والقروبات ومراسلة القوائم البريدية.',
          'إعداد وثيقة سرية المعلومات وتوقيعها عبر منصة الجائزة لكل من يتعامل مع الجائزة.',
        ],
        discItems: [],
        specialItems2: [],
      },
      {
        id: 'phase-3',
        header: '3. مرحلة التحضير والإعداد بعد التدشين وحتى ما بعد الاحتفاء بالفائزين',
        specialItems: [
          'توزيع المهام على لجان أو أشخاص تشمل توجيه المرشحين لوسائل المراسلات واستقبال تقديماتهم وتصفيتها وتدقيق المعلومات.',
          'رقابة مواءمة إجراءات الجائزة مع ما تم صياغته في الرؤية والأهداف واللائحة ولائحتها التنفيذية وتطبيقه في كل الإجراءات.',
          'إعداد الميزانية الأولية للجائزة في هذه الدورة وتحديد العدد الأعلى للفائزين (بين أمين الجائزة وصاحبها ومن يترأس في هذه المهمة).',
          'الدعوة لاجتماع في حال مستجدات تهم المتقدمين أو الوقائع له علاقة بالتقديمات والترشيحات والإجراءات والجائزة.',
          'تقديم إرشادات واضحة للمتقدمين حول كيفية تقديمهم بفيديوهاتهم لقنوات محددة للدعم بعيداً عن التواصل المباشر لتحقيق النزاهة.',
          'تذكير المتقدمين بالمواعيد النهائية.',
          'الرد على الاستفسارات وتقديم الدعم الفني.',
          'الإعلان عن إغلاق وتأكيد تسليم الطلبات.',
          'رصد وتحليل وارشفة بيانات و وثائق المتقدمين واعداد تقرير يشمل تحليل مبسط للمتقدمين مثل العدد والعمر والجنس والمجال والمؤهل.',
          'تسليم كافة مخرجات الجائزة للجنة التحكيم.',
          'تنظيم حفل تكريم في نهاية اغسطس.',
          'أخذ التقييم لمخرجات الدورة الأولى للجائزة لتلافي بعض سلبياتها في الدورة التالية للجائزة.',
          'إعداد مجلد شامل عن الجائزة بشكل عام وعن الجائزة للدورة الأولى وكافة أنشطتها ومواضيعها ومخرجاتها واحتفالاتها.',
        ],
        discItems: [],
        specialItems2: [],
        noteItem: 'وأثرها ليكون مجلد وافي يستحق إهدائه لبعض المسؤولين في الدولة وللفائزين والمهتمين.',
      },
      {
        id: 'phase-4',
        header: '4. مرحلة التقييم والتحكيم للمرشحين',
        specialItems: [
          'فرز وتصنيف مجالات المتقدمين.',
          'التحقق من توافر معايير التميز في الأعمال المرشحة وقد تشمل مقابلات في حدها الأدنى.',
          'إعداد قوالب التقييم ومعايير التقييم.',
          'تحديد عدد الفائزين ونوع التكريم والجوائز.',
          'تشكيل اللجان وفق تصنيف ومتطلبات مواضيع المتقدمين للترشيح. اختيار المحكمين بناءً على متطلبات الإجراءات للتقييم.',
          'فرز وتصفية المتقدمين للوصول لقائمة صغيرة لا تزيد عن ضعفي عدد المتقدمين.',
          'المفاضلة النهائية. تسمية الفائزين. رفع التقارير النهائية لأمين الجائزة وصاحب الجائزة.',
        ],
        discItems: [],
        specialItems2: [],
      },
      {
        id: 'phase-5',
        header: '5. مرحلة إعلان الفائزين والاحتفال والتكريم (أغسطس)',
        specialItems: [
          'اسناد هذه المهمة إلى البند 3 والاجتهاد في تفعيل كل ما يدعم الوصول لاحتفال يليق بالحدث.',
        ],
        discItems: [],
        specialItems2: [],
      },
      {
        id: 'phase-6',
        header: '6. مرحلة المراجعة والتقييم للدورة الحالية للجائزة الإيجابيات والسلبيات (سبتمبر)',
        specialItems: [
          'تكوين فريق لهذه المهمة :',
          'بناء وإعداد نماذج التقييم والاستبيانات.',
          'إشراك واستفتاء فريق المهام في البندين 2 و3. استفتاء اللجنة، المجلس، صاحب الجائزة، أمانتها، والجمهور.',
          'تحليل البيانات ورفع التوصيات لأمانة الجائزة.',
          'الدعوة لإجتماع تحضيري للدورة القادمة وفق تاريخ تختاره أمانة الجائزة.',
        ],
        discItems: [],
        specialItems2: [],
      },
      {
        id: 'phase-7',
        header: '7. وقت مفتوح ومراجعة داخلية أكتوبر - وديسمبر (أمين السر وصاحب الجائزة)',
        specialItems: [
          'عادةً بعد انتهاء الدورة الحالية تبقى الجائزة في تحضير للدورة التالية بعد عامين.',
          'التشاور والتنسيق يستمر بين صاحب الجائزة وأمانة الجائزة يستمر إلى أن يبدأ التحضير للدورة التالية.',
        ],
        discItems: [],
        specialItems2: [],
      },
    ],
  },
}

export default function AwardSchedule() {
  const { lang } = useLanguage()
  const data = content[lang]
  const [openId, setOpenId] = useState<string | null>(null)

  const toggle = (id: string) => {
    setOpenId(prev => (prev === id ? null : id))
  }

  return (
    <section className={styles.scheduleSection} aria-label="Award Schedule">
      <div className={styles.scheduleContainer}>

        {/* Titles */}
        <h2 className={styles.scheduleTitle}>{data.title}</h2>
        <h3 className={styles.scheduleSubtitle}>{data.subtitle1}</h3>
        <h3 className={styles.scheduleSubtitle}>{data.subtitle2}</h3>

        {/* Accordion */}
        <div className={styles.scheduleAccordionWrapper}>
          {data.phases.map((phase) => {
            const isOpen = openId === phase.id
            return (
              <div
                key={phase.id}
                className={`${styles.scheduleAccordionItem} ${isOpen ? styles.scheduleAccordionItemActive : ''}`}>

                {/* Header */}
                <button
                  className={styles.scheduleAccordionHeader}
                  onClick={() => toggle(phase.id)}
                  aria-expanded={isOpen}>
                  <span>{phase.header}</span>
                  <span className={`${styles.scheduleAccordionIcon} ${isOpen ? styles.scheduleAccordionIconOpen : ''}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </span>
                </button>

                {/* Content */}
                <div className={`${styles.scheduleAccordionContent} ${isOpen ? styles.scheduleAccordionContentOpen : ''}`}>
                  <div className={styles.scheduleAccordionInner}>

                    {/* First special list */}
                    {phase.specialItems.length > 0 && (
                      <ul className={styles.scheduleListClean}>
                        {phase.specialItems.map((item, i) => (
                          <li key={i} className={styles.scheduleSpecialItem}>
                            <span className={styles.scheduleCheckIcon}>✔</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Disc list (dates etc.) */}
                    {phase.discItems.length > 0 && (
                      <ul className={styles.scheduleDiscList}>
                        {phase.discItems.map((item, i) => (
                          <li key={i} className={styles.scheduleDiscItem}>{item}</li>
                        ))}
                      </ul>
                    )}

                    {/* Second special list */}
                    {phase.specialItems2.length > 0 && (
                      <ul className={styles.scheduleListClean}>
                        {phase.specialItems2.map((item, i) => (
                          <li key={i} className={styles.scheduleSpecialItem}>
                            <span className={styles.scheduleCheckIcon}>✔</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Note item (no bullet) */}
                    {'noteItem' in phase && phase.noteItem && (
                      <p className={styles.scheduleNoteItem}>{phase.noteItem}</p>
                    )}

                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}