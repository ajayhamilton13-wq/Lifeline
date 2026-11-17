package expo.modules.lifelinemesh

import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.AdvertisingOptions
import com.google.android.gms.nearby.connection.ConnectionInfo
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback
import com.google.android.gms.nearby.connection.ConnectionResolution
import com.google.android.gms.nearby.connection.ConnectionsClient
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo
import com.google.android.gms.nearby.connection.DiscoveryOptions
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback
import com.google.android.gms.nearby.connection.Payload
import com.google.android.gms.nearby.connection.PayloadCallback
import com.google.android.gms.nearby.connection.PayloadTransferUpdate
import com.google.android.gms.nearby.connection.Strategy
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Collections

/**
 * Links nearby Lifeline phones over Bluetooth / Wi-Fi Direct (no internet needed)
 * and passes text messages between them. Relaying across many phones is done in JS.
 */
class LifelineMeshModule : Module() {
  private val serviceId = "com.ajay5.lifeline.mesh"
  private val strategy = Strategy.P2P_CLUSTER
  private val connected: MutableSet<String> = Collections.synchronizedSet(mutableSetOf())
  private val pending: MutableSet<String> = Collections.synchronizedSet(mutableSetOf())
  private var localName = "Lifeline"
  private var running = false

  private val client: ConnectionsClient
    get() = Nearby.getConnectionsClient(
      appContext.reactContext ?: throw IllegalStateException("App context not ready")
    )

  private fun emitPeers() {
    sendEvent("onPeersChanged", mapOf("count" to connected.size))
  }

  private val payloadCallback = object : PayloadCallback() {
    override fun onPayloadReceived(endpointId: String, payload: Payload) {
      val bytes = payload.asBytes() ?: return
      sendEvent("onMessage", mapOf("endpointId" to endpointId, "data" to String(bytes, Charsets.UTF_8)))
    }

    override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {}
  }

  private val connectionCallback = object : ConnectionLifecycleCallback() {
    override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
      // Every Lifeline phone accepts every other Lifeline phone automatically.
      client.acceptConnection(endpointId, payloadCallback)
    }

    override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
      pending.remove(endpointId)
      if (result.status.isSuccess) connected.add(endpointId)
      emitPeers()
    }

    override fun onDisconnected(endpointId: String) {
      connected.remove(endpointId)
      emitPeers()
    }
  }

  private val discoveryCallback = object : EndpointDiscoveryCallback() {
    override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
      if (connected.contains(endpointId) || pending.contains(endpointId)) return
      pending.add(endpointId)
      client.requestConnection(localName, endpointId, connectionCallback)
        .addOnFailureListener { pending.remove(endpointId) }
    }

    override fun onEndpointLost(endpointId: String) {
      pending.remove(endpointId)
    }
  }

  private fun stopAll() {
    try {
      client.stopAdvertising()
      client.stopDiscovery()
      client.stopAllEndpoints()
    } catch (_: Exception) {
    }
    connected.clear()
    pending.clear()
    running = false
  }

  override fun definition() = ModuleDefinition {
    Name("LifelineMesh")

    Events("onMessage", "onPeersChanged")

    AsyncFunction("start") { name: String, promise: Promise ->
      localName = name
      if (running) {
        promise.resolve(true)
        return@AsyncFunction
      }
      try {
        client.startAdvertising(
          localName, serviceId, connectionCallback,
          AdvertisingOptions.Builder().setStrategy(strategy).build()
        ).addOnSuccessListener {
          client.startDiscovery(
            serviceId, discoveryCallback,
            DiscoveryOptions.Builder().setStrategy(strategy).build()
          ).addOnSuccessListener {
            running = true
            promise.resolve(true)
          }.addOnFailureListener { e ->
            promise.reject("E_DISCOVERY", e.message ?: "Could not search for nearby phones", e)
          }
        }.addOnFailureListener { e ->
          promise.reject("E_ADVERTISE", e.message ?: "Could not make this phone visible", e)
        }
      } catch (e: Exception) {
        promise.reject("E_START", e.message ?: "Could not start offline messaging", e)
      }
    }

    Function("stop") {
      stopAll()
      emitPeers()
    }

    Function("broadcast") { data: String ->
      val targets = synchronized(connected) { connected.toList() }
      if (targets.isNotEmpty()) {
        client.sendPayload(targets, Payload.fromBytes(data.toByteArray(Charsets.UTF_8)))
      }
      targets.size
    }

    Function("peerCount") {
      connected.size
    }

    OnDestroy {
      stopAll()
    }
  }
}
