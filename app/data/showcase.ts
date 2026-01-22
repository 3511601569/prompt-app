export interface ShowcaseItem {
  id: string
  title: string
  prompt: string
  tags: string[]
  color: string
  image?: string
}

export const showcaseData: ShowcaseItem[] = [
  {
    id: 'cyberpunk-detective',
    title: '赛博朋克侦探',
    prompt: 'A cyberpunk detective in a neon-lit futuristic city, wearing a trench coat with holographic details, standing in the rain with neon signs reflecting on wet streets, cinematic lighting, 8k resolution, highly detailed, Blade Runner aesthetic, volumetric fog, --ar 16:9 --v 6.0',
    tags: ['MJ', 'Cyberpunk', 'Portrait', 'Sci-Fi'],
    color: 'from-purple-500 to-indigo-500',
    image: '/showcase/1.jpg',
  },
  {
    id: 'ghibli-forest',
    title: '宫崎骏风格森林',
    prompt: 'A whimsical forest scene with magical creatures, Studio Ghibli style, soft pastel colors, lush green trees with dappled sunlight, floating spirits and fireflies, gentle breeze animation feel, dreamy atmosphere, hand-drawn aesthetic, --ar 16:9 --v 6.0',
    tags: ['MJ', 'Ghibli', 'Fantasy', 'Nature'],
    color: 'from-green-400 to-emerald-500',
    image: '/showcase/2.jpg',

  },
  {
    id: 'minimal-product',
    title: '极简产品摄影',
    prompt: 'Minimalist product photography of a sleek modern watch on a clean white background, soft natural lighting, shallow depth of field, professional studio setup, high-end commercial photography style, crisp details, --ar 1:1 --v 6.0',
    tags: ['MJ', 'Product', 'Minimalist', 'Photography'],
    color: 'from-gray-200 to-gray-400',
    image: '/showcase/3.jpg',
  },
  {
    id: '3d-blind-box',
    title: '3D 盲盒公仔',
    prompt: 'A cute 3D rendered blind box toy character, chibi style, vibrant colors, smooth plastic texture, kawaii aesthetic, soft shadows, studio lighting, collectible figure design, adorable expression, --ar 1:1 --v 6.0',
    tags: ['MJ', '3D', 'Toy', 'Kawaii'],
    color: 'from-pink-400 to-rose-500',
    image: '/showcase/4.jpg',
  },
  {
    id: 'retro-80s', 
    title: '80年代合成波', 
    prompt: 'Synthwave style, 80s retro aesthetic, a DeLorean sports car driving on a neon grid landscape, digital sunset with a large sun in the background, silhouette of palm trees, purple and pink neon lighting, retrofuturism, VHS glitch effect, lo-fi vibe, 4k resolution, cinematic composition',
    tags: ['MJ', 'Synthwave', 'Retro'],
    color: 'from-pink-500 to-purple-600',
    image: '/showcase/5.jpg',
  },
  {
    id: 'chinese-ink-painting',
    title: '中国山水画',
    prompt: 'Traditional Chinese ink painting of misty mountains and flowing rivers, elegant brush strokes, monochrome with subtle color accents, serene landscape, poetic atmosphere, classical Chinese art style, ethereal mist, --ar 9:16 --v 6.0',
    tags: ['MJ', 'Chinese', 'Ink Painting', 'Traditional'],
    color: 'from-stone-300 to-stone-600',
    image: '/showcase/6.jpg',
  },
]
