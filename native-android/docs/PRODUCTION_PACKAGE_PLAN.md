# Üretim paketinin bağlantısı

## Analiz — 11 Ekim 2026

Önceki imzalı teknik aday yerel `supabase.properties` dosyasını okuyordu. Bu dosya test projesine dönünce bir sonraki release de test ortamına bağlanabiliyordu. Mağaza paketinin üretim kullanıcısını test ortamına yönlendirmesi kabul edilemez.

## Uygulama

- Debug yerel ayarlarını kullanır; özgün test emülatörü ve kullanıcısı korunur.
- Release yalnızca kaynakta izlenen `config/production.properties` genel uygulama kimliklerini kullanır. Dosyada yalnızca üretim URL, publishable key ve web Google client ID bulunur.
- Release yapılandırması bilinen üretim projesini zorunlu tutar; imza anahtarı yine özel yerel dosyadan alınır.
- Paket doğrulayıcı, hem APK hem AAB içindeki derlenmiş DEX dosyalarında üretim adresini arar; test adresi varsa işlemi durdurur. Kaynak ayarı tek başına kanıt kabul edilmez.

## Kabul

İmzalı APK/AAB derlenir; üretim bağlantısı, eski yükleme imzası ve 16 KB statik kontrol aynı çıktıda doğrulanır. İkon ve mağaza görselleri son aşamada değişeceğinden bu paket nihai dağıtım paketi sayılmaz. Play imzalı Google girişi ve Play tarafından üretilen parçalar ayrıca test edilir.

## Doğrulama sonucu

Release APK/AAB ve Lint başarılı. İki paketin derlenmiş DEX dosyalarında üretim adresi var, test adresi yok. Eski upload sertifikası ve APK/AAB imzaları eşleşti; ARM64/X86_64 ELF ve APK ZIP 16 KB kontrolü geçti.

- APK SHA256: `3951afa2dc89516f26a40903b032e6220405e0c5d807f2690a2a55eafcda5662`
- AAB SHA256: `1cba21d75b04bfe7e2ad33f5b0edd60d1f4dc3829e996a59f9ecdf897bc2a2df`
- Sürüm: 47 / 2.0.0; Play'e henüz yüklenmedi.
