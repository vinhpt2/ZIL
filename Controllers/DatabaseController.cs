using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text.Json.Nodes;

namespace SQLRestC.Controllers
{
    [Authorize]
    [ApiController]
    [Route(Global.ROOT+"database")]
    public class DatabaseController : ControllerBase
    {
        //list all databases info
        [HttpGet]
        public ResponseJson GetAll(bool isDetail = false, bool isSystem=false)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                
                return new ResponseJson { success = true, result = Global.getDatabaseInfo(server,isDetail,isSystem) };
                
            } catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.InnerException == null ? ex.Message : (ex.InnerException.InnerException == null ? ex.InnerException.Message : ex.InnerException.InnerException.Message) };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }

        //get database info by name
        [HttpGet("{name}")]
        public ResponseJson Get(String name, bool isDetail = false)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var obj = server.Databases[name];
                var response = new ResponseJson { success= (obj != null) };
                if (response.success)
                {
                    response.result = new DatabaseJson
                    {
                        id = obj.ID,
                        name = obj.Name,
                        created=obj.CreateDate,
                        dataUsage = obj.DataSpaceUsage,
                        indexUsage = obj.IndexSpaceUsage,
                        schemas = isDetail ? Global.getSchemaInfo(obj, obj.IsSystemObject) : null
                    };
                }
                else response.result = "Database '" + name + "' not found!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.InnerException == null ? ex.Message : (ex.InnerException.InnerException == null ? ex.InnerException.Message : ex.InnerException.InnerException.Message) };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }

        }
        
        //create database
        [HttpPost("{name}")]
        public ResponseJson Create(String name)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var response = new ResponseJson { success = !server.Databases.Contains(name) };
                if (response.success)
                {
                    var obj = new Database(server, name);
                    obj.Create();
                    response.result = obj.Name;
                } else response.result= "Database '" + name + "' already exists!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.InnerException == null ? ex.Message : (ex.InnerException.InnerException == null ? ex.InnerException.Message : ex.InnerException.InnerException.Message) };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }
        }

        //rename database
        [HttpPut("{name}")]
        public ResponseJson Rename(String name,String newName)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var obj = server.Databases[name];
                var response = new ResponseJson { success = (obj!=null) };
                if (response.success)
                {
                    obj.Rename(newName);
                }
                else response.result = "Database '" + name + "' not exists!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.InnerException == null ? ex.Message : (ex.InnerException.InnerException == null ? ex.InnerException.Message : ex.InnerException.InnerException.Message) };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }
        }

        //drop database
        [HttpDelete("{name}")]
        public ResponseJson Drop(String name)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var obj = server.Databases[name];
                var response = new ResponseJson { success = (obj!=null) };
                if (response.success)
                {
                    obj.Drop();
                }
                else response.result = "Database '" + name + "' not exists!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.InnerException == null ? ex.Message : (ex.InnerException.InnerException == null ? ex.InnerException.Message : ex.InnerException.InnerException.Message) };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }
        }
    }
}
