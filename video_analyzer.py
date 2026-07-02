import sys
import os

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    print("Library belum terinstall. Silakan jalankan: pip install youtube-transcript-api")
    sys.exit(1)

def format_time(seconds):
    minutes = int(seconds) // 60
    sec = int(seconds) % 60
    return f"{minutes:02d}:{sec:02d}"

def analyze_video(video_id):
    print(f"Mencari transkrip untuk video: {video_id}...")
    try:
        # Coba ambil transkrip bahasa Indonesia, fallback ke bahasa Inggris
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
            transcript = transcript_list.find_generated_transcript(['id', 'en']).fetch()
        except:
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            
        print(f"\n=== POTONGAN PEMBAHASAN VIDEO ({video_id}) ===")
        
        # Gabungkan teks per 60 detik (1 menit) agar lebih mudah dibaca
        chunk_size = 60 
        current_chunk_start = 0
        current_text = []
        
        for entry in transcript:
            start = entry['start']
            text = entry['text'].replace('\n', ' ')
            
            # Jika sudah masuk ke rentang waktu (chunk) berikutnya
            if start >= current_chunk_start + chunk_size:
                if current_text:
                    time_range = f"[{format_time(current_chunk_start)} - {format_time(current_chunk_start + chunk_size)}]"
                    print(f"{time_range} {' '.join(current_text)}\n")
                
                current_chunk_start += chunk_size
                # Maju cepat jika ada jeda panjang tanpa bicara
                while start >= current_chunk_start + chunk_size:
                    current_chunk_start += chunk_size
                current_text = [text]
            else:
                current_text.append(text)
                
        # Cetak sisa teks terakhir
        if current_text:
            time_range = f"[{format_time(current_chunk_start)} - {format_time(current_chunk_start + chunk_size)}]"
            print(f"{time_range} {' '.join(current_text)}\n")
            
        print("Selesai! Kamu bisa menggunakan potongan teks di atas untuk mencocokkan waktu bookmark di courseData.js.")
        
    except Exception as e:
        print(f"Gagal mengambil transkrip: {e}")
        print("Pastikan video memiliki subtitle/CC (Closed Captions) yang aktif di YouTube.")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Cara penggunaan: python video_analyzer.py <VIDEO_ID>")
        print("Contoh: python video_analyzer.py RnyYn2SzFVU")
    else:
        analyze_video(sys.argv[1])
