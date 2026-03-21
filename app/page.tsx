import Link from 'next/link'

const STARTER_POKEMON = [
  { id: 39,  name: 'Jigglypuff' },
  { id: 1,   name: 'Bulbasaur'  },
  { id: 4,   name: 'Charmander' },
  { id: 7,   name: 'Squirtle'   },
  { id: 25,  name: 'Pikachu'    },
  { id: 133, name: 'Eevee'      },
]

function artworkUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

export default function Home() {
  const left  = STARTER_POKEMON.slice(0, 3)   // Jigglypuff, Bulbasaur, Charmander
  const right = STARTER_POKEMON.slice(3)       // Squirtle, Pikachu, Eevee

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1
        className="text-5xl sm:text-7xl mb-1"
        style={{
          fontFamily: "'Bangers', 'Impact', cursive",
          color: '#FFCB05',
          WebkitTextStroke: '3px #2A75BB',
          paintOrder: 'stroke fill',
          letterSpacing: '0.04em',
          textShadow: '4px 4px 0 #1a4f7a',
        }}
      >
        PJ&apos;s Pokemon
      </h1>
      <p className="text-xl sm:text-2xl text-gray-700 mb-6 font-medium">
        PJ&apos;s Pokemon Adventure!
      </p>

      {/* Character lineup — Pokemon + PJ standing together */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 mb-8 px-2">
        {/* Left Pokemon */}
        {left.map((p) => (
          <img
            key={p.id}
            src={artworkUrl(p.id)}
            alt={p.name}
            width={80}
            height={80}
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md"
          />
        ))}

        {/* PJ — taller, center */}
        <img
          src="/images/PokeMaster PJ.png"
          alt="PokeMaster PJ"
          width={200}
          height={200}
          className="w-36 h-36 sm:w-48 sm:h-48 object-contain drop-shadow-lg"
        />

        {/* Right Pokemon */}
        {right.map((p) => (
          <img
            key={p.id}
            src={artworkUrl(p.id)}
            alt={p.name}
            width={80}
            height={80}
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md"
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Link
          href="/encounter"
          className="bg-gradient-to-r from-[#CC0000] to-[#FF4444] text-white text-2xl font-bold rounded-full px-10 py-5 shadow-xl hover:scale-110 transition-transform min-h-[64px] inline-flex items-center justify-center"
        >
          Let&apos;s Play!
        </Link>
        <Link
          href="/pokemon-list"
          className="bg-[#FFCB05] text-gray-900 text-2xl font-bold rounded-full px-10 py-5 shadow-xl hover:scale-110 transition-transform min-h-[64px] inline-flex items-center justify-center"
        >
          Pokédex 📖
        </Link>
      </div>
    </main>
  )
}
