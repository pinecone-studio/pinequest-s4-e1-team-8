export const VOICE_ONBOARDING_PROMPTS: readonly string[] = [
  "Өнөөдөр цаг агаар сайхан байна. Би өөрийн дуу хоолойг системд бүртгүүлж, дараагийн алхамд шилжихэд бэлэн боллоо.",
  "Мэдээллийн технологийн хөгжил бидний амьдралыг улам хялбарчилсаар байна. Энэхүү платформыг ашиглахад таатай байна.",
  "Хүн бүр өөрийн гэсэн өвөрмөц дуу хоолойтой байдаг. Та одоо тайван бөгөөд жигд хэмнэлээр уншиж эхэлж болно.",
  "Шинэ долоо хоног эхэлж байгаа бөгөөд төлөвлөсөн ажлуудаа цаг тухайд нь дуусгахыг хичээх хэрэгтэй. Амжилт хүсье.",
];

export function pickRandomVoicePrompt(excluding?: string): string {
  const candidates =
    excluding !== undefined
      ? VOICE_ONBOARDING_PROMPTS.filter((prompt) => prompt !== excluding)
      : VOICE_ONBOARDING_PROMPTS;

  const pool = candidates.length > 0 ? candidates : VOICE_ONBOARDING_PROMPTS;

  return pool[Math.floor(Math.random() * pool.length)];
}
