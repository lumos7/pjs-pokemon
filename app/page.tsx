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
        className="text-5xl sm:text-7xl font-extrabold text-[#FFCB05] mb-1"
        style={{ textShadow: '3px 3px 0 #CC0000, 6px 6px 0 rgba(0,0,0,0.1)' }}
      >
        PJ&apos;s Pokemon
      </h1>
      <p className="text-xl sm:text-2xl text-gray-700 mb-6 font-medium">
        Aziah&apos;s Pokemon Adventure!
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
          className="bg-gradient-to-r from-[#CC0000] to-[#FF4444] text-white text-2xl font-bold rounded-full px-12 py-6 shadow-xl hover:scale-110 transition-transform min-h-[64px] inline-flex items-center"
        >
          Let&apos;s Play!
        </Link>
        <Link
          href="/pokemon-list"
          className="bg-[#FFCB05] text-gray-900 text-xl font-bold rounded-full px-8 py-5 shadow-lg hover:scale-105 transition-transform min-h-[64px] inline-flex items-center"
        >
          Pokédex 📖
        </Link>
      </div>
    </main>
  )
}
