export type LangCode = 'en' | 'hi' | 'pa' | 'ta' | 'zh' | 'vi';

export interface Translations {
  // Common
  ok: string;
  cancel: string;
  call: string;
  safe: string;
  sent: string;

  // Tab labels
  tabHome: string;
  tabMap: string;
  tabFamily: string;
  tabPlans: string;
  tabSettings: string;

  // Home
  monitoring: string;
  readDetails: string;
  readAloud: string;
  stop: string;
  seeAll: string;
  familySafe: string;
  updatedAgo: string;

  // Alert
  alertAdvice: string;
  alertStormHeadline: string;
  alertStormDetail: string;
  alertWhatToDo: string;
  stayInside: string;
  awayFromWindows: string;
  keepTorchReady: string;
  listenForUpdates: string;

  // Map
  dangerNearYou: string;
  whatIsNearby: string;
  imSafe: string;
  sentConfirmation: string;
  bushfireNearby: string;
  floodRiskArea: string;
  yourHomeSafe: string;
  leaveArea: string;
  beReadyToLeave: string;
  stayAlertUpdates: string;
  noActionNeeded: string;
  danger: string;
  warning: string;
  advice: string;

  // Family
  familySafety: string;
  tellEveryoneSafe: string;
  familyMembers: string;
  checkIn: string;
  noReply: string;
  checkInSent: string;
  notificationSentTo: string;

  // Plans
  whatToDo: string;
  simpleSteps: string;
  ifFire: string;
  ifFlood: string;
  ifStorm: string;
  leaveHouseNow: string;
  takeChildren: string;
  goMeetingPoint: string;
  call000: string;
  goUpstairs: string;
  dontWalkWater: string;
  callSES: string;
  emergency000: string;
  callEmergency: string;

  // Settings
  settings: string;
  language: string;
  accessibility: string;
  textSize: string;
  readAlertsAloud: string;
  vibrateOnAlert: string;
  highContrast: string;
  emergencyContacts: string;
  testAlert: string;
  testAlertDesc: string;
  testAlertMessage: string;
  languageChanged: string;
}

const en: Translations = {
  ok: 'OK',
  cancel: 'Cancel',
  call: 'Call',
  safe: 'Safe',
  sent: 'Sent!',

  tabHome: 'Home',
  tabMap: 'Map',
  tabFamily: 'Family',
  tabPlans: 'Plans',
  tabSettings: 'Settings',

  monitoring: 'MONITORING',
  readDetails: 'Read details',
  readAloud: 'Read aloud',
  stop: 'Stop',
  seeAll: 'See all',
  familySafe: 'Family · {count} safe',
  updatedAgo: 'Updated 2 min ago',

  alertAdvice: 'ADVICE',
  alertStormHeadline: 'Thunderstorm moving in from the west.',
  alertStormDetail: 'Thunderstorm moving in from the west. Stay indoors and away from windows. Keep a torch ready.',
  alertWhatToDo: 'What to do:',
  stayInside: 'Stay inside',
  awayFromWindows: 'Stay away from windows',
  keepTorchReady: 'Keep torch ready',
  listenForUpdates: 'Listen for updates',

  dangerNearYou: 'Danger near you',
  whatIsNearby: 'What is nearby',
  imSafe: "I'm Safe",
  sentConfirmation: 'Your family knows you are safe.',
  bushfireNearby: 'Bushfire nearby',
  floodRiskArea: 'Flood risk area',
  yourHomeSafe: 'Your home — Safe',
  leaveArea: 'Leave the area if possible.',
  beReadyToLeave: 'Be ready to leave.',
  stayAlertUpdates: 'Stay alert for updates.',
  noActionNeeded: 'No action needed.',
  danger: 'DANGER',
  warning: 'WARNING',
  advice: 'ADVICE',

  familySafety: 'Family safety',
  tellEveryoneSafe: 'Tell everyone you are safe',
  familyMembers: 'Family members',
  checkIn: 'Check in',
  noReply: 'No reply',
  checkInSent: 'Check in sent',
  notificationSentTo: 'A notification was sent to {name}.',

  whatToDo: 'What to do',
  simpleSteps: 'Simple steps to keep you safe',
  ifFire: 'If there is a fire',
  ifFlood: 'If there is a flood',
  ifStorm: 'If there is a storm',
  leaveHouseNow: 'Leave the house NOW',
  takeChildren: 'Take children with you',
  goMeetingPoint: 'Go to meeting point',
  call000: 'Call 000',
  goUpstairs: 'Go upstairs',
  dontWalkWater: 'Do NOT walk in water',
  callSES: 'Call 132 500 (SES)',
  emergency000: 'Emergency: 000',
  callEmergency: 'Call 000',

  settings: 'Settings',
  language: 'Language',
  accessibility: 'Accessibility',
  textSize: 'Text size',
  readAlertsAloud: 'Read alerts aloud',
  vibrateOnAlert: 'Vibrate on alert',
  highContrast: 'High contrast',
  emergencyContacts: 'Emergency contacts',
  testAlert: 'Test alert',
  testAlertDesc: 'Hear and see what an alert looks like',
  testAlertMessage: 'This is what an alert looks and feels like. You will feel vibration and see a message like this.',
  languageChanged: 'Language changed',
};

const hi: Translations = {
  ok: 'ठीक है',
  cancel: 'रद्द',
  call: 'कॉल',
  safe: 'सुरक्षित',
  sent: 'भेज दिया!',

  tabHome: 'होम',
  tabMap: 'नक्शा',
  tabFamily: 'परिवार',
  tabPlans: 'योजना',
  tabSettings: 'सेटिंग्स',

  monitoring: 'निगरानी',
  readDetails: 'विवरण पढ़ें',
  readAloud: 'ज़ोर से पढ़ें',
  stop: 'रुकें',
  seeAll: 'सब देखें',
  familySafe: 'परिवार · {count} सुरक्षित',
  updatedAgo: '2 मिनट पहले अपडेट',

  alertAdvice: 'सलाह',
  alertStormHeadline: 'पश्चिम से तूफान आ रहा है।',
  alertStormDetail: 'पश्चिम से तूफान आ रहा है। घर के अंदर रहें और खिड़कियों से दूर रहें। टॉर्च तैयार रखें।',
  alertWhatToDo: 'क्या करें:',
  stayInside: 'अंदर रहें',
  awayFromWindows: 'खिड़कियों से दूर रहें',
  keepTorchReady: 'टॉर्च तैयार रखें',
  listenForUpdates: 'अपडेट सुनें',

  dangerNearYou: 'आपके पास खतरे',
  whatIsNearby: 'आपके आसपास क्या है',
  imSafe: 'मैं सुरक्षित हूँ',
  sentConfirmation: 'आपके परिवार को पता चल गया कि आप सुरक्षित हैं।',
  bushfireNearby: 'पास में जंगल की आग',
  floodRiskArea: 'बाढ़ का खतरा',
  yourHomeSafe: 'आपका घर — सुरक्षित',
  leaveArea: 'यदि संभव हो तो क्षेत्र छोड़ दें।',
  beReadyToLeave: 'जाने के लिए तैयार रहें।',
  stayAlertUpdates: 'अपडेट के लिए सतर्क रहें।',
  noActionNeeded: 'कोई कार्रवाई की आवश्यकता नहीं।',
  danger: 'खतरा',
  warning: 'चेतावनी',
  advice: 'सलाह',

  familySafety: 'परिवार की सुरक्षा',
  tellEveryoneSafe: 'सबको बताएं कि आप सुरक्षित हैं',
  familyMembers: 'परिवार के सदस्य',
  checkIn: 'जांचें',
  noReply: 'कोई जवाब नहीं',
  checkInSent: 'जांच भेजी',
  notificationSentTo: '{name} को सूचना भेजी गई।',

  whatToDo: 'क्या करना है',
  simpleSteps: 'आपको सुरक्षित रखने के आसान कदम',
  ifFire: 'अगर आग लगे',
  ifFlood: 'अगर बाढ़ आए',
  ifStorm: 'अगर तूफान आए',
  leaveHouseNow: 'अभी घर से बाहर निकलें',
  takeChildren: 'बच्चों को साथ लें',
  goMeetingPoint: 'मिलन स्थल पर जाएं',
  call000: '000 पर कॉल करें',
  goUpstairs: 'ऊपर जाएं',
  dontWalkWater: 'पानी में न चलें',
  callSES: '132 500 (SES) पर कॉल करें',
  emergency000: 'आपातकाल: 000',
  callEmergency: '000 पर कॉल करें',

  settings: 'सेटिंग्स',
  language: 'भाषा',
  accessibility: 'पहुँच',
  textSize: 'अक्षर का आकार',
  readAlertsAloud: 'अलर्ट ज़ोर से पढ़ें',
  vibrateOnAlert: 'अलर्ट पर कंपन',
  highContrast: 'उच्च कंट्रास्ट',
  emergencyContacts: 'आपातकालीन संपर्क',
  testAlert: 'अलर्ट का परीक्षण',
  testAlertDesc: 'देखें और सुनें कि अलर्ट कैसा होता है',
  testAlertMessage: 'यह एक अलर्ट ऐसा दिखता और महसूस होता है। आप कंपन महसूस करेंगे और इस तरह का संदेश देखेंगे।',
  languageChanged: 'भाषा बदली',
};

export const translations: Record<string, Translations> = {
  en,
  hi,
  // Other languages fall back to English
  pa: en,
  ta: en,
  zh: en,
  vi: en,
};
