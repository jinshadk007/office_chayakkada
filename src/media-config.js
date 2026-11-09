// Existing approved reference photo only. No old video is used by this experience.
export const referencePhoto={poster:'/media/tea-delivery.jpg',disclosure:'Office reference photo'};
// Replace with the NEW film after consent, asset review, and publication approval.
export const generatedScene={
 publicationApproved:false,newlyGeneratedFilm:false,consentReference:null,license:null,
 src:null,poster:null,captions:null,audioApproved:false,
 framePath:null,frameCount:0,width:240,height:426,
 disclosure:'AI-generated scene · used with permission',
};
export const voiceLines={
 order:{publicationApproved:false,consentReference:null,license:null,src:null,caption:'ചായ വരുന്നുണ്ട് മോനേ!'},
 invite:{publicationApproved:false,consentReference:null,license:null,src:null,caption:'ഡാ മക്കളേ, ചായ കുടിക്കാൻ വരുന്നില്ലേ?'},
 ready:{publicationApproved:false,consentReference:null,license:null,src:null,caption:'ചായ റെഡി! എല്ലാവരും വേഗം വാ!'},
};
export function isApprovedMedia(asset){return !!(asset?.publicationApproved&&asset.consentReference?.trim()&&asset.license?.trim()&&typeof asset.src==='string'&&asset.src.startsWith('/media/approved/')&&!asset.src.includes('..'));}
export function approvedVideoScene(asset=generatedScene){return isApprovedMedia(asset)&&asset.newlyGeneratedFilm?asset:null;}
export function approvedFrameScene(asset=generatedScene){return approvedVideoScene(asset)&&typeof asset.framePath==='string'&&asset.framePath.startsWith('/media/approved/')&&!asset.framePath.includes('..')&&Number.isInteger(asset.frameCount)&&asset.frameCount>1&&asset.frameCount<=240&&Number.isInteger(asset.width)&&asset.width>0&&asset.width<=1080&&Number.isInteger(asset.height)&&asset.height>0&&asset.height<=1920?asset:null;}
