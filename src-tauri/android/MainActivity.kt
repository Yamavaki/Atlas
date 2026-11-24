// Atlas - atividade do Android (copiada sobre a gerada pelo Tauri no build; o "package" vem da gerada).
// O Android 15 desenha o app por baixo da barra de status e da barra de gestos: aqui o conteudo ganha
// margem do tamanho dessas barras (e do teclado), com o fundo escuro do Atlas atras delas.
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.os.Bundle
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.setBackgroundDrawable(ColorDrawable(Color.parseColor("#0F0D0A")))
    val ctl = WindowCompat.getInsetsController(window, window.decorView)
    ctl.isAppearanceLightStatusBars = false
    ctl.isAppearanceLightNavigationBars = false
    val root = findViewById<View>(android.R.id.content)
    ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
      val b = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
      val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
      v.setPadding(b.left, b.top, b.right, maxOf(b.bottom, ime.bottom))
      WindowInsetsCompat.CONSUMED
    }
  }
}
