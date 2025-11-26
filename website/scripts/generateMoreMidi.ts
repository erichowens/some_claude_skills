import * as fs from 'fs';
import * as path from 'path';
import MidiWriter from 'midi-writer-js';

/**
 * SYNTHWAVE/OUTRUN - Fast paced 80s nostalgia with DX7-style sounds
 * 128 BPM driving beat with arpeggios and pulsing bass
 */
function generateOutrunNights(): Uint8Array {
  const tempo = 128;

  // Lead synth - DX7 style brass lead
  const leadTrack = new MidiWriter.Track();
  leadTrack.setTempo(tempo);
  leadTrack.addInstrumentName('Synth Lead');
  leadTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 81 })); // Lead 2 (sawtooth)

  // Catchy synthwave melody
  const melody = [
    'A4', 'A4', 'C5', 'D5', 'E5', 'D5', 'C5', 'A4',
    'A4', 'A4', 'C5', 'D5', 'E5', 'E5', 'E5', 'E5',
    'G4', 'G4', 'A4', 'C5', 'D5', 'C5', 'A4', 'G4',
    'F4', 'F4', 'A4', 'C5', 'D5', 'D5', 'D5', 'D5',
  ];

  melody.forEach(note => {
    leadTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: '8',
      velocity: 100,
    }));
  });

  // Arpeggio - Classic 80s arp pattern
  const arpTrack = new MidiWriter.Track();
  arpTrack.setTempo(tempo);
  arpTrack.addInstrumentName('Arp Synth');
  arpTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 82 })); // Lead 3 (calliope)

  const arpPattern = ['A3', 'C4', 'E4', 'A4', 'E4', 'C4', 'A3', 'C4'];
  for (let i = 0; i < 8; i++) {
    arpPattern.forEach(note => {
      arpTrack.addEvent(new MidiWriter.NoteEvent({
        pitch: note,
        duration: '16',
        velocity: 85,
      }));
    });
  }

  // Pulsing bass
  const bassTrack = new MidiWriter.Track();
  bassTrack.setTempo(tempo);
  bassTrack.addInstrumentName('Synth Bass');
  bassTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 38 })); // Synth Bass 1

  const bassLine = ['A2', 'A2', 'A2', 'A2', 'G2', 'G2', 'G2', 'G2',
                    'F2', 'F2', 'F2', 'F2', 'D2', 'D2', 'D2', 'D2'];
  bassLine.forEach(note => {
    bassTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: '4',
      velocity: 110,
    }));
  });

  // Pad - Lush DX7 pad
  const padTrack = new MidiWriter.Track();
  padTrack.setTempo(tempo);
  padTrack.addInstrumentName('Synth Pad');
  padTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 89 }));

  const pads = [
    ['A3', 'C4', 'E4', 'A4'],
    ['G3', 'B3', 'D4', 'G4'],
    ['F3', 'A3', 'C4', 'F4'],
    ['D3', 'F3', 'A3', 'D4'],
  ];

  pads.forEach(chord => {
    for (let i = 0; i < 2; i++) {
      padTrack.addEvent(new MidiWriter.NoteEvent({
        pitch: chord,
        duration: '1',
        velocity: 70,
      }));
    }
  });

  const write = new MidiWriter.Writer([leadTrack, arpTrack, bassTrack, padTrack]);
  return new Uint8Array(write.buildFile());
}

/**
 * WITCH HOUSE - Dark, slowed trap with eerie synths
 * 70 BPM with heavy reverb vibes, distorted sounds
 */
function generateDarkRitual(): Uint8Array {
  const tempo = 70;

  // Eerie lead
  const leadTrack = new MidiWriter.Track();
  leadTrack.setTempo(tempo);
  leadTrack.addInstrumentName('Dark Lead');
  leadTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 98 })); // FX 3 (crystal)

  // Haunting, sparse melody
  const melody = [
    { note: 'E5', duration: '2', wait: '4' },
    { note: 'D5', duration: '4', wait: '4' },
    { note: 'C5', duration: '2', wait: '2' },
    { note: 'B4', duration: '1', wait: '1' },
    { note: 'E5', duration: '4', wait: '4' },
    { note: 'G5', duration: '2', wait: '2' },
    { note: 'E5', duration: '2', wait: '4' },
    { note: 'C5', duration: '1', wait: '1' },
  ];

  melody.forEach(({ note, duration, wait }) => {
    leadTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: duration as any,
      velocity: 60,
    }));
    if (wait) {
      leadTrack.addEvent(new MidiWriter.NoteEvent({
        pitch: 'C0',
        duration: wait as any,
        velocity: 0,
      }));
    }
  });

  // Distorted pad
  const padTrack = new MidiWriter.Track();
  padTrack.setTempo(tempo);
  padTrack.addInstrumentName('Dark Pad');
  padTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 95 })); // FX 8 (sci-fi)

  const darkChords = [
    ['E3', 'G3', 'B3'],
    ['C3', 'E3', 'G3'],
    ['A2', 'C3', 'E3'],
    ['E3', 'G3', 'B3'],
  ];

  darkChords.forEach(chord => {
    for (let i = 0; i < 2; i++) {
      padTrack.addEvent(new MidiWriter.NoteEvent({
        pitch: chord,
        duration: '1',
        velocity: 80,
      }));
    }
  });

  // Deep trap-style bass
  const bassTrack = new MidiWriter.Track();
  bassTrack.setTempo(tempo);
  bassTrack.addInstrumentName('Sub Bass');
  bassTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 39 }));

  const bass = ['E1', 'E1', 'C1', 'C1', 'A1', 'A1', 'E1', 'E1'];
  bass.forEach(note => {
    bassTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: '1',
      velocity: 120,
    }));
  });

  // High-pitched glitchy effects
  const fxTrack = new MidiWriter.Track();
  fxTrack.setTempo(tempo);
  fxTrack.addInstrumentName('Glitch FX');
  fxTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 102 })); // FX 7 (echoes)

  const glitches = ['C7', 'D7', 'E7', 'C7', 'G6', 'A6', 'C7', 'E7'];
  glitches.forEach(note => {
    fxTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: '16',
      velocity: 40,
    }));
    fxTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: 'C0',
      duration: '8',
      velocity: 0,
    }));
  });

  const write = new MidiWriter.Writer([leadTrack, padTrack, bassTrack, fxTrack]);
  return new Uint8Array(write.buildFile());
}

/**
 * VAPORTRAP - Vaporwave meets trap with 808s
 * 85 BPM with slowed samples feel and trap hi-hats
 */
function generateVaporTrap(): Uint8Array {
  const tempo = 85;

  // Slowed jazz sample feel
  const jazzTrack = new MidiWriter.Track();
  jazzTrack.setTempo(tempo);
  jazzTrack.addInstrumentName('Jazz Keys');
  jazzTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 4 })); // Electric Piano 1

  const jazzMelody = [
    'F#4', 'A4', 'C#5', 'E5', 'C#5', 'A4',
    'F#4', 'A4', 'D5', 'F#5', 'D5', 'A4',
    'E4', 'G#4', 'B4', 'D5', 'B4', 'G#4',
    'E4', 'G#4', 'C#5', 'E5', 'C#5', 'G#4',
  ];

  jazzMelody.forEach(note => {
    jazzTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: '8',
      velocity: 75,
    }));
  });

  // 808 Bass
  const bassTrack = new MidiWriter.Track();
  bassTrack.setTempo(tempo);
  bassTrack.addInstrumentName('808 Bass');
  bassTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 39 }));

  const trapBass = [
    { note: 'F#1', duration: '4' },
    { note: 'F#1', duration: '8' },
    { note: 'F#1', duration: '8' },
    { note: 'E1', duration: '4' },
    { note: 'E1', duration: '4' },
  ];

  for (let i = 0; i < 4; i++) {
    trapBass.forEach(({ note, duration }) => {
      bassTrack.addEvent(new MidiWriter.NoteEvent({
        pitch: note,
        duration: duration as any,
        velocity: 115,
      }));
    });
  }

  // Dreamy pad
  const padTrack = new MidiWriter.Track();
  padTrack.setTempo(tempo);
  padTrack.addInstrumentName('Dream Pad');
  padTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 89 }));

  const chords = [
    ['F#3', 'A3', 'C#4', 'F#4'],
    ['E3', 'G#3', 'B3', 'E4'],
  ];

  chords.forEach(chord => {
    for (let i = 0; i < 4; i++) {
      padTrack.addEvent(new MidiWriter.NoteEvent({
        pitch: chord,
        duration: '1',
        velocity: 65,
      }));
    }
  });

  const write = new MidiWriter.Writer([jazzTrack, bassTrack, padTrack]);
  return new Uint8Array(write.buildFile());
}

/**
 * CHIPTUNE/DEMOSCENE - Fast tracker-style music
 * 150 BPM with square wave leads and arpeggios
 */
function generateChipDreams(): Uint8Array {
  const tempo = 150;

  // Square wave lead
  const leadTrack = new MidiWriter.Track();
  leadTrack.setTempo(tempo);
  leadTrack.addInstrumentName('Chip Lead');
  leadTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 80 })); // Lead 1 (square)

  // Fast chiptune melody
  const chipMelody = [
    'C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'C5', 'E5',
    'D5', 'F5', 'A5', 'D6', 'A5', 'F5', 'D5', 'F5',
    'E5', 'G5', 'B5', 'E6', 'B5', 'G5', 'E5', 'G5',
    'C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'C5', 'C5',
  ];

  chipMelody.forEach(note => {
    leadTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: '16',
      velocity: 100,
    }));
  });

  // Arpeggio
  const arpTrack = new MidiWriter.Track();
  arpTrack.setTempo(tempo);
  arpTrack.addInstrumentName('Chip Arp');
  arpTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 80 }));

  const arp = ['C4', 'E4', 'G4', 'C5'];
  for (let i = 0; i < 32; i++) {
    arpTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: arp[i % 4],
      duration: '16',
      velocity: 85,
    }));
  }

  // Bass
  const bassTrack = new MidiWriter.Track();
  bassTrack.setTempo(tempo);
  bassTrack.addInstrumentName('Chip Bass');
  bassTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 38 }));

  const bass = ['C2', 'C2', 'D2', 'D2', 'E2', 'E2', 'C2', 'C2'];
  bass.forEach(note => {
    for (let i = 0; i < 2; i++) {
      bassTrack.addEvent(new MidiWriter.NoteEvent({
        pitch: note,
        duration: '4',
        velocity: 110,
      }));
    }
  });

  const write = new MidiWriter.Writer([leadTrack, arpTrack, bassTrack]);
  return new Uint8Array(write.buildFile());
}

/**
 * MORE VAPORWAVE - Slowed jazz with heavy reverb vibes
 * 72 BPM, ultra chill
 */
function generateMallSoft(): Uint8Array {
  const tempo = 72;

  // Slowed smooth jazz
  const jazzTrack = new MidiWriter.Track();
  jazzTrack.setTempo(tempo);
  jazzTrack.addInstrumentName('Smooth Jazz');
  jazzTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 25 })); // Acoustic Guitar (nylon)

  const jazzChords = [
    ['D4', 'F#4', 'A4', 'C5'],  // Dmaj7
    ['G3', 'B3', 'D4', 'F#4'],  // Gmaj7
    ['C4', 'E4', 'G4', 'B4'],   // Cmaj7
    ['F3', 'A3', 'C4', 'E4'],   // Fmaj7
  ];

  jazzChords.forEach(chord => {
    for (let i = 0; i < 2; i++) {
      jazzTrack.addEvent(new MidiWriter.NoteEvent({
        pitch: chord,
        duration: '1',
        velocity: 70,
      }));
    }
  });

  // Saxo phone-like lead
  const saxTrack = new MidiWriter.Track();
  saxTrack.setTempo(tempo);
  saxTrack.addInstrumentName('Sax Lead');
  saxTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 65 })); // Alto Sax

  const saxMelody = [
    'F#5', 'E5', 'D5', 'C5', 'D5', 'A4', 'D5', 'F#5',
    'G5', 'F#5', 'E5', 'D5', 'B4', 'D5', 'G5', 'B5',
  ];

  saxMelody.forEach(note => {
    saxTrack.addEvent(new MidiWriter.NoteEvent({
      pitch: note,
      duration: '4',
      velocity: 85,
    }));
  });

  // Pad
  const padTrack = new MidiWriter.Track();
  padTrack.setTempo(tempo);
  padTrack.addInstrumentName('Vapor Pad');
  padTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 89 }));

  const pads = [
    ['D3', 'F#3', 'A3'],
    ['G3', 'B3', 'D4'],
    ['C3', 'E3', 'G3'],
    ['F3', 'A3', 'C4'],
  ];

  pads.forEach(chord => {
    for (let i = 0; i < 2; i++) {
      padTrack.addEvent(new MidiWriter.NoteEvent({
        pitch: chord,
        duration: '1',
        velocity: 60,
      }));
    }
  });

  const write = new MidiWriter.Writer([jazzTrack, saxTrack, padTrack]);
  return new Uint8Array(write.buildFile());
}

// Generate all tracks
const outputDir = path.join(__dirname, '..', 'static', 'audio');

console.log('Generating MORE vaporwave/synthwave/witch house MIDI files...\n');

const tracks = [
  { name: 'outrun-nights.mid', data: generateOutrunNights(), genre: 'Synthwave/Outrun' },
  { name: 'dark-ritual.mid', data: generateDarkRitual(), genre: 'Witch House' },
  { name: 'vapor-trap.mid', data: generateVaporTrap(), genre: 'Vaportrap' },
  { name: 'chip-dreams.mid', data: generateChipDreams(), genre: 'Chiptune/Demoscene' },
  { name: 'mall-soft.mid', data: generateMallSoft(), genre: 'Vaporwave' },
];

tracks.forEach(({ name, data, genre }) => {
  const filePath = path.join(outputDir, name);
  fs.writeFileSync(filePath, Buffer.from(data));
  console.log(`✓ Generated ${name} (${genre})`);
});

console.log(`\n🎵 ALL TRACKS GENERATED! 🎵`);
console.log(`Output: ${outputDir}`);
