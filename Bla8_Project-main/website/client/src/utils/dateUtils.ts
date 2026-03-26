/**
 * Formats a date or ISO string into a relative time string (e.g., "منذ 5 دقائق")
 */
export function formatTimeAgo(dateInput: string | Date | null): string {
  if (!dateInput) return "سابقاً";
  
  const now = new Date();
  const date = new Date(dateInput);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "الآن";
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `منذ ${diffInMinutes} ${diffInMinutes === 1 ? 'دقيقة' : (diffInMinutes >= 3 && diffInMinutes <= 10 ? 'دقائق' : 'دقيقة')}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `منذ ${diffInHours} ${diffInHours === 1 ? 'ساعة' : (diffInHours >= 3 && diffInHours <= 10 ? 'ساعات' : 'ساعة')}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `منذ ${diffInDays} ${diffInDays === 1 ? 'يوم' : (diffInDays >= 3 && diffInDays <= 10 ? 'أيام' : 'يوم')}`;
  }
  
  return date.toLocaleDateString('ar-EG');
}
