const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
} = require("@bot-whatsapp/bot");
const dotenv = require("dotenv").config();
const QRPortalWeb = require("@bot-whatsapp/portal");
const axios = require("axios");
const WebWhatsappProvider = require("@bot-whatsapp/provider/web-whatsapp");
const MockAdapter = require("@bot-whatsapp/database/mock");

/**
 * Aqui declaramos los flujos hijos, los flujos se declaran de atras para adelante, es decir que si tienes un flujo de este tipo:
 *
 *          Menu Principal
 *           - SubMenu 1
 *             - Submenu 1.1
 *           - Submenu 2
 *             - Submenu 2.1
 *
 * Primero declaras los submenus 1.1 y 2.1, luego el 1 y 2 y al final el principal.
 */

const consultarPadron = async (cedula) => {
  const data = {
    cpt: "-",
    cedula: cedula,
  };

  const url = process.env.ARN_URL;
  const options = {
    method: "POST",
    data: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await axios(url, options);
    const resultado = response.data;
    return resultado;
  } catch (error) {
    console.error("API Cayo", error);
    throw new Error(
      "Estamos haciendo un mantemiento a las busquedas, por favor intente nuevamente mas tarde ☺️"
    );
  }
};

const hola = async (cedula) => {
  try {
    const resultado = await consultarPadron(cedula);
    return resultado.data;
  } catch (error) {
    console.error("Error al ejecutar la función hola", error);
    throw new Error(
      "No se pudo realizar la búsqueda, por favor, intente nuevamente más tarde"
    );
  }
};

const flowSecundario = addKeyword([
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
]).addAnswer(["Estamos con muchas solicitudes actualmente y no podemos procesar todas, pero si necesita saber dónde vota aquí puede consultar: https://padron.tsje.gov.py/ "]);

let res = null;

const flowPrincipal = addKeyword(["si"])
  .addAnswer(
    "👋🏻¡Hola querido Cuidadano! *¡Bienvenido al bot de datos electorales!*"
  )
  .addAnswer(
    "👤 Introduce tu Número de Cédula:",
    { capture: true },
    async (ctx, { flowDynamic, endFlow }) => {
      const verifyNumber = async () => {
        if (/^[0-9]+$/.test(ctx.body)) {
          res = await hola(ctx.body);
          return true;
        } else {
          flowDynamic(`❌ Debe ser un número`);
          return endFlow("Escriba *Si* para una nueva busqueda 🔎");
        }
      };

      const SendData = async () => {
        if (res !== null) {
          console.log(res[0]);
          flowDynamic([
            `🗳 𝗗𝗔𝗧𝗢𝗦 𝗗𝗘𝗟 𝗩𝗢𝗧𝗔𝗡𝗧𝗘：↓\n*Nombre*: ${res[0].apellido}\n*Apellido*: ${res[0].nombre}\n*Departamento*: ${res[0].departamento}\n*Distrito*: ${res[0].distrito}\n*Local*: ${res[0].local}\n*Mesa*: ${res[0].mesa}\n*Orden*: ${res[0].orden}`,
          ]);
        } else {
          flowDynamic(
            `❌ No encontramos coincidencia con el numero de documento: ${ctx.body}`
          );
        }
      };

      if (await verifyNumber()) {
        try {
          await SendData();
        } catch (error) {
          flowDynamic(
            "❌ Estamos haciendo un mantemiento a las busquedas, por favor intente nuevamente mas tarde ☺️"
          );
        }
      }
    }
  )
  .addAnswer("Escriba *Si* para una nueva busqueda 🔎");

const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([flowPrincipal, flowSecundario]);
  const adapterProvider = createProvider(WebWhatsappProvider);
  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });
  QRPortalWeb();
};

main();
